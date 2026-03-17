# Changelog

## [1.2.0](https://github.com/Yom-Rishon/yomrishon-mcp-sora/compare/v1.1.0...v1.2.0) (2026-03-17)


### Features

* add release manager skill and conventional commits reference ([6e72e62](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/6e72e6268eacd87d0125381f142204f9ff4ebdcb))
* add support for short-lived download tokens in README ([b9d72b9](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/b9d72b9c6e4f8c5cff723305c3eec45ad78e9201))
* disable default request timeout for SSE streams in HTTP server ([44a38d6](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/44a38d615a078f0378525e60656481a715131e6c))
* remove branch restriction from Docker publish workflow ([f4a2e59](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/f4a2e596b3973a4d7726ef74635cd6af484a8661))
* remove remix video functionality and update related capabilities in documentation ([4b27920](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/4b279204dee6b94e1507d665447003aff8c2f570))
* remove step to update Docker Hub README in workflow ([6e81336](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/6e813360ccabc641c63e286950755958cfb03186))
* update character creation to use FormData and remove unsupported metadata ([b412a89](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/b412a89e7d93d6e166bd02e85efd2efef362b0e5))
* update version to 1.3.0 in package.json ([08629cb](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/08629cb30a83f69c2f5f58741634eaa661f6977f))

## [1.1.0](https://github.com/Yom-Rishon/yomrishon-mcp-sora/compare/v1.0.1...v1.1.0) (2026-03-17)


### Features

* add docker-compose configuration for mcp-sora service ([9f0d2ee](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/9f0d2ee93836233dcacaddf2694377fe45576618))
* add release manager skill and conventional commits reference ([6e72e62](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/6e72e6268eacd87d0125381f142204f9ff4ebdcb))
* add step to update Docker Hub README in workflow ([30426a4](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/30426a4ccda1f848ee66a3b14bc179c43db61eb0))
* add support for short-lived download tokens in README ([b9d72b9](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/b9d72b9c6e4f8c5cff723305c3eec45ad78e9201))
* disable default request timeout for SSE streams in HTTP server ([44a38d6](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/44a38d615a078f0378525e60656481a715131e6c))
* implement download token system for secure video access ([be502e0](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/be502e0b7b98eedf458a555c71bd0477593f72fc))
* remove branch restriction from Docker publish workflow ([f4a2e59](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/f4a2e596b3973a4d7726ef74635cd6af484a8661))
* remove step to update Docker Hub README in workflow ([6e81336](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/6e813360ccabc641c63e286950755958cfb03186))
* update character creation to use FormData and remove unsupported metadata ([b412a89](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/b412a89e7d93d6e166bd02e85efd2efef362b0e5))
* update version to 1.1.0 and enhance changelog with new download features ([51f3123](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/51f3123a77e90f06d5fcd5ea3b674618d2bb2e0c))
* update video processing parameters and improve server handling ([5efaea4](https://github.com/Yom-Rishon/yomrishon-mcp-sora/commit/5efaea4e985f59c2d120ddd3ebc7e885d10b9bc1))

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
