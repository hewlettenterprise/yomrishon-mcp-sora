# Changelog

## [1.1.0] - 2026-03-17

### Added
- Proxy download endpoint (`GET /download/:token`) so clients can download generated videos without needing an API key
- Single-use, time-limited download tokens (10-minute expiry) for secure unauthenticated access

### Changed
- `sora_download_video_content` now returns a `download_url` proxy URL instead of exposing the upstream signed URL

## [1.0.1] - 2026-03-16

### Fixed
- Update Docker image name in workflow to match new project naming convention

### Changed
- Update Docker actions to latest versions in workflow

## [1.0.0] - Initial Release

- MCP server for OpenAI Sora 2 video generation
- Video creation, editing, extending, and remixing tools
- Character management
- HTTP and stdio transport modes
- Docker support
