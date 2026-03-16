import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { HelpPromptSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  _client: OpenAIClient,
  _config: Config,
  _logger: Logger
): void {
  server.registerTool(
    "sora_help_prompt",
    {
      description:
        "Generate a structured cinematography-style prompt brief from a rough idea. " +
        "Returns a framework with sections for subject, action, setting, camera, lighting, " +
        "style, continuity, and constraints — plus composition tips and an example structure. " +
        "Does NOT call the OpenAI API. Use this to structure your thinking before calling " +
        "sora_create_video. The output helps you compose a high-quality Sora prompt.",
      inputSchema: HelpPromptSchema,
    },
    async (params) => {
      try {
        const idea = params.idea as string;
        const style = params.style as string | undefined;
        const durationHint = params.duration_hint as string | undefined;
        const constraints = params.constraints as string[] | undefined;

        const brief = {
          input_idea: idea,
          prompt_sections: {
            subject: {
              label: "Subject",
              description:
                "Who or what is the main focus of the video",
              guidance:
                "Be specific about appearance, clothing, distinguishing features. " +
                "If using a character asset, use the exact character name here.",
            },
            action: {
              label: "Action / Movement",
              description:
                "What happens over the duration of the clip",
              guidance:
                "Describe movement and progression in present tense. Think about " +
                "what changes from start to end of the clip. Use concrete verbs.",
            },
            setting: {
              label: "Setting / Environment",
              description:
                "Where the scene takes place",
              guidance:
                "Interior/exterior, urban/natural, time of day, season, weather, " +
                "atmospheric conditions. Ground the scene in a specific place.",
            },
            camera: {
              label: "Camera",
              description:
                "Camera movement, angle, and framing",
              guidance:
                "Use cinematography terms: slow dolly in, static wide shot, " +
                "handheld tracking, crane up, low-angle, over-the-shoulder. " +
                "Specify lens feel: wide-angle, telephoto, macro. " +
                "Avoid vague terms like 'zoom' — be specific about movement direction.",
            },
            lighting: {
              label: "Lighting",
              description:
                "Light quality, direction, and mood",
              guidance:
                "Golden hour, overcast, harsh midday, neon-lit, candlelit, " +
                "rim-lit silhouette, volumetric fog, dappled sunlight. " +
                "Lighting strongly affects mood — be intentional.",
            },
            style: {
              label: "Style / Aesthetic",
              description: "Visual approach",
              guidance:
                "Cinematic, documentary, animated, photorealistic, film noir, " +
                "dreamlike, music video, commercial, analog film grain, etc.",
              from_input: style ?? null,
            },
            continuity: {
              label: "Continuity Notes",
              description:
                "Notes for maintaining consistency across clips",
              guidance:
                "Reference character names, color palette, art direction, " +
                "spatial relationships if this is part of a multi-shot sequence.",
            },
          },
          constraints: constraints ?? [],
          duration_hint: durationHint ?? null,
          composition_tips: [
            "Lead with the subject and action, then layer in setting and camera",
            "Use present tense: 'A woman walks' not 'A woman walking'",
            "Specify camera movement explicitly: 'slow dolly in' not just 'zoom'",
            "Describe what the viewer SEES, not production instructions",
            "Mention lighting conditions to set mood",
            "Be specific about composition (foreground, midground, background)",
            "For character consistency, name characters and describe distinctive features",
            "Keep text out of the scene — Sora doesn't reliably render readable text",
            "One cohesive scene per prompt works best — avoid cutting between unrelated shots",
            "Avoid words like 'generate', 'create', 'render' — describe the scene as if it exists",
          ],
          avoid: [
            "Vague adjectives like 'cool', 'nice', 'amazing'",
            "Multiple unrelated scenes in one prompt",
            "Text or dialogue — Sora can't reliably render readable words",
            "Exact frame-by-frame timing — use general pacing instead",
            "Production instructions — describe the final result, not the process",
          ],
          example_prompt_structure:
            "A [subject with specific details] [action/movement] in [setting with " +
            "atmosphere]. [Camera movement and framing]. [Lighting description]. " +
            "[Style/aesthetic notes]. [Any pacing or timing notes].",
          example_prompt:
            "A young woman in a red coat walks along a rain-soaked cobblestone " +
            "street in Prague at dusk. Slow tracking shot following her from behind, " +
            "camera at waist height. Warm streetlamp glow reflects off wet stones, " +
            "neon signs blur in the background. Cinematic, shallow depth of field, " +
            "35mm film grain. She pauses at a corner and looks up at the sky.",
        };

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(brief, null, 2) },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
