import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { Config } from "./config.js";
import type { Logger } from "./logger.js";
import {
  openaiApiError,
  rateLimitError,
  notFoundError,
} from "./errors.js";
import type {
  VideoJob,
  VideoContent,
  Character,
  VideoListResult,
} from "./types.js";

// ---------------------------------------------------------------------------
//  Raw OpenAI response shapes (internal — not exported)
// ---------------------------------------------------------------------------

interface RawVideoResponse {
  id: string;
  status: string;
  model?: string;
  prompt?: string;
  size?: string;
  seconds?: number | string;
  duration?: number | string;
  created_at?: string | number;
  completed_at?: string | number;
  progress?: number;
  error?: { code?: string; message?: string };
  output_url?: string;
  output_expires_at?: string;
  [key: string]: unknown;
}

interface RawListResponse {
  data: RawVideoResponse[];
  has_more?: boolean;
  first_id?: string;
  last_id?: string;
}

interface RawContentResponse {
  url: string;
  content_type?: string;
  expires_at?: string;
  [key: string]: unknown;
}

interface RawCharacterResponse {
  id: string;
  name: string;
  description?: string;
  created_at?: string | number;
  file_id?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
//  OpenAI API client
// ---------------------------------------------------------------------------

export class OpenAIClient {
  private baseUrl: string;
  private authHeader: string;
  private requestCounter = 0;

  constructor(
    private config: Config,
    private logger: Logger
  ) {
    this.baseUrl = config.openaiBaseUrl.replace(/\/+$/, "");
    this.authHeader = `Bearer ${config.openaiApiKey}`;
  }

  getApiKey(): string {
    return this.config.openaiApiKey!;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private nextRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  // -- Generic request helper ------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const requestId = this.nextRequestId();
    const url = `${this.baseUrl}${path}`;
    const start = Date.now();

    this.logger.debug("openai_request", {
      requestId,
      method,
      path,
      ...(body && this.config.debug
        ? { body: body as Record<string, unknown> }
        : {}),
    });

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
      ...extraHeaders,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw openaiApiError(
        `Network error calling OpenAI API: ${message}`,
        undefined,
        { requestId, path }
      );
    }

    const elapsed = Date.now() - start;
    this.logger.debug("openai_response", {
      requestId,
      status: response.status,
      elapsed_ms: elapsed,
    });

    if (!response.ok) {
      return this.handleErrorResponse(response, requestId, path);
    }

    const json = (await response.json()) as T;
    if (this.config.debug) {
      this.logger.debug("openai_response_body", {
        requestId,
        body: json as Record<string, unknown>,
      });
    }
    return json;
  }

  private async handleErrorResponse(
    response: Response,
    requestId: string,
    path: string
  ): Promise<never> {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = (await response.json()) as Record<string, unknown>;
    } catch {
      // body may not be JSON
    }

    const nested = errorBody.error as Record<string, unknown> | undefined;
    const errorMsg = nested?.message ?? errorBody.message ?? response.statusText;

    if (response.status === 429) {
      throw rateLimitError(`Rate limited by OpenAI API: ${errorMsg}`, {
        requestId,
        path,
        retryAfter: response.headers.get("retry-after"),
      });
    }

    if (response.status === 404) {
      throw notFoundError(`Resource not found: ${errorMsg}`, {
        requestId,
        path,
      });
    }

    throw openaiApiError(
      `OpenAI API error (${response.status}): ${errorMsg}`,
      response.status,
      { requestId, path, upstream: errorBody }
    );
  }

  // -- Video operations ------------------------------------------------------

  async createVideo(params: {
    model: string;
    prompt: string;
    size: string;
    seconds: number;
    input_reference?: { image_url?: string; file_id?: string };
    characters?: Array<{ id: string; name: string }>;
    metadata?: Record<string, string>;
  }): Promise<VideoJob> {
    const body: Record<string, unknown> = {
      model: params.model,
      prompt: params.prompt,
      size: params.size,
      seconds: String(params.seconds),
    };
    if (params.input_reference) body.input_reference = params.input_reference;
    if (params.characters?.length)
      body.characters = params.characters.map((c) => ({ id: c.id }));
    // metadata is MCP-only context; OpenAI API does not accept it

    const raw = await this.request<RawVideoResponse>(
      "POST",
      "/videos",
      body
    );
    return this.normalizeVideoJob(raw);
  }

  async getVideo(videoId: string): Promise<VideoJob> {
    const raw = await this.request<RawVideoResponse>(
      "GET",
      `/videos/${encodeURIComponent(videoId)}`
    );
    return this.normalizeVideoJob(raw);
  }

  async listVideos(params?: {
    limit?: number;
    after?: string;
    order?: "asc" | "desc";
  }): Promise<VideoListResult> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.after) query.set("after", params.after);
    if (params?.order) query.set("order", params.order);

    const qs = query.toString();
    const path = `/videos${qs ? `?${qs}` : ""}`;
    const raw = await this.request<RawListResponse>("GET", path);

    return {
      videos: raw.data.map((v) => this.normalizeVideoJob(v)),
      has_more: raw.has_more ?? false,
      first_id: raw.first_id,
      last_id: raw.last_id,
    };
  }

  async getVideoContent(videoId: string): Promise<VideoContent> {
    const requestId = this.nextRequestId();
    const path = `/videos/${encodeURIComponent(videoId)}/content`;
    const url = `${this.baseUrl}${path}`;

    this.logger.debug("openai_request", { requestId, method: "GET", path });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Authorization: this.authHeader },
        redirect: "manual",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw openaiApiError(
        `Network error calling OpenAI API: ${message}`,
        undefined,
        { requestId, path }
      );
    }

    // If the API redirects to a download URL, return that URL
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        return {
          url: location,
          content_type: response.headers.get("content-type") ?? "video/mp4",
          expires_at: "",
        };
      }
    }

    if (!response.ok) {
      return this.handleErrorResponse(response, requestId, path);
    }

    const contentType = response.headers.get("content-type") ?? "";

    // If the response is JSON, parse it normally
    if (contentType.includes("application/json")) {
      const raw = (await response.json()) as RawContentResponse;
      return {
        url: raw.url,
        content_type: raw.content_type ?? "video/mp4",
        expires_at: raw.expires_at ?? "",
      };
    }

    // The API returned binary video data directly — return the direct API URL
    // so the caller can download it themselves
    return {
      url,
      content_type: contentType || "video/mp4",
      expires_at: "",
    };
  }

  async editVideo(params: {
    source_video_id: string;
    prompt: string;
  }): Promise<VideoJob> {
    const body: Record<string, unknown> = {
      prompt: params.prompt,
      video: { id: params.source_video_id },
    };

    const raw = await this.request<RawVideoResponse>(
      "POST",
      "/videos/edits",
      body
    );
    return this.normalizeVideoJob(raw);
  }

  async extendVideo(params: {
    video_id: string;
    prompt: string;
    seconds?: number;
  }): Promise<VideoJob> {
    const body: Record<string, unknown> = {
      prompt: params.prompt,
      video: { id: params.video_id },
    };
    if (params.seconds) body.seconds = String(params.seconds);

    const raw = await this.request<RawVideoResponse>(
      "POST",
      "/videos/extensions",
      body
    );
    return this.normalizeVideoJob(raw);
  }

  // -- Character operations --------------------------------------------------

  async createCharacter(params: {
    name: string;
    file_path: string;
  }): Promise<Character> {
    const fileBuffer = await readFile(params.file_path);
    const fileName = basename(params.file_path);

    const formData = new FormData();
    formData.append("name", params.name);
    formData.append("video", new Blob([fileBuffer]), fileName);

    const requestId = this.nextRequestId();
    const url = `${this.baseUrl}/videos/characters`;

    this.logger.debug("openai_create_character", {
      requestId,
      name: params.name,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { Authorization: this.authHeader },
        body: formData,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw openaiApiError(
        `Network error creating character: ${message}`,
        undefined,
        { requestId, path: "/videos/characters" }
      );
    }

    if (!response.ok) {
      return this.handleErrorResponse(
        response,
        requestId,
        "/videos/characters"
      );
    }

    const raw = (await response.json()) as RawCharacterResponse;
    return this.normalizeCharacter(raw);
  }

  async getCharacter(characterId: string): Promise<Character> {
    const raw = await this.request<RawCharacterResponse>(
      "GET",
      `/videos/characters/${encodeURIComponent(characterId)}`
    );
    return this.normalizeCharacter(raw);
  }

  // -- Normalization ---------------------------------------------------------

  private normalizeVideoJob(raw: RawVideoResponse): VideoJob {
    const status = this.normalizeStatus(raw.status);
    const seconds = Number(raw.seconds ?? raw.duration ?? 0);

    const createdAt =
      typeof raw.created_at === "number"
        ? new Date(raw.created_at * 1000).toISOString()
        : (raw.created_at ?? new Date().toISOString());

    const completedAt =
      raw.completed_at != null
        ? typeof raw.completed_at === "number"
          ? new Date(raw.completed_at * 1000).toISOString()
          : raw.completed_at
        : undefined;

    const job: VideoJob = {
      id: raw.id,
      status,
      model: raw.model ?? "",
      prompt: raw.prompt ?? "",
      size: raw.size ?? "",
      seconds,
      created_at: createdAt,
    };

    if (completedAt) job.completed_at = completedAt;
    if (raw.progress != null) job.progress = Number(raw.progress);
    if (raw.error) {
      job.error = {
        code: raw.error.code ?? "unknown",
        message: raw.error.message ?? "Unknown error",
      };
    }
    if (raw.output_url) job.output_url = raw.output_url;
    if (raw.output_expires_at) job.output_expires_at = raw.output_expires_at;

    return job;
  }

  private normalizeStatus(status: string): VideoJob["status"] {
    switch (status) {
      case "queued":
      case "in_progress":
      case "completed":
      case "failed":
        return status;
      default:
        return "in_progress";
    }
  }

  private normalizeCharacter(raw: RawCharacterResponse): Character {
    const createdAt =
      typeof raw.created_at === "number"
        ? new Date(raw.created_at * 1000).toISOString()
        : (raw.created_at ?? new Date().toISOString());

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      created_at: createdAt,
      file_id: raw.file_id,
    };
  }
}
