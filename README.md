# Fusion Loom

Fusion Loom is a comprehensive platform that weaves together multiple AI technologies and content management systems into a unified, powerful interface. Designed for both AI enthusiasts and professionals, Fusion Loom provides seamless access to Language Models, Image Generation, Text-to-Speech, Speech-to-Text, and more from a single intuitive workspace.

> **Note:** Fusion Loom v1.0 is a complete rebranding and enhancement of the previously named AI-Garage project. The AI-Garage repository is now deprecated in favor of this new project.

## Features

- **Unified Dashboard**: Access all your AI tools from a single, intuitive interface.
- **Language Model Integration**: Interact with various LLMs through a tabbed interface.
- **Generative AI Support**: Manage and use Stable Diffusion models for image generation.
- **Text-to-Speech (TTS)**: Convert text to speech using integrated TTS services.
- **Speech-to-Text (STS)**: Transcribe audio to text with STS capabilities.
- **Container Management**: Monitor and control Docker containers running AI services.
- **Performance Monitoring**: Keep track of system resources with built-in performance gauges.
- **Customizable Themes**: Choose from various color themes to personalize your experience.
- **Persistent Sessions**: Save and restore your work sessions across application restarts.

**Coming Soon:**
- Retrieval-Augmented Generation (RAG) support
- AI Agent orchestration
- Image library management and tagging
- Document management and tagging
- Note management integration (Obsidian, Evernote)

## Screenshots

*[Screenshots will be added soon]*

## Installation

1. Clone the repository:  
   ```bash
   git clone https://github.com/CaptainASIC/FusionLoom
   ```

2. Run the setup script:  
   ```bash
   ./setup.sh
   ```

3. Run the application:  
   ```bash
   ./launch.sh
   ```

## Requirements

- Python 3.8+
- Docker or Podman
- At least 8GB RAM for basic functionality
- GPU recommended for Stable Diffusion and larger LLMs

## Configuration

The application uses a configuration file located at `cfg/config.ini`. You can modify this file to add or change AI service endpoints, container configurations, and other settings. A sample is provided as `config.sample`.

```ini
[General]
theme = dark
save_sessions = true

[Endpoints]
llm_api = http://localhost:8000/v1
stable_diffusion = http://localhost:7860
tts_service = http://localhost:5500/api/tts
sts_service = http://localhost:5501/api/sts

[Containers]
auto_start = true
container_engine = podman
```

## Usage

- Use the sidebar menu to navigate between different AI services.
- Manage running containers and their statuses from the status bar at the bottom.
- Access the settings page to customize the application, manage endpoints, and change themes.

### LLM Interface

The LLM interface allows you to interact with various language models through a tabbed interface. You can:
- Create multiple chat sessions
- Save and load conversations
- Adjust model parameters like temperature and top_p
- Export conversations in various formats

### Stable Diffusion

The Stable Diffusion interface provides:
- Text-to-image generation
- Image-to-image modification
- Inpainting capabilities
- Model switching and parameter adjustment

### Text-to-Speech

Convert text to speech using various voices and styles:
- Multiple voice options
- Adjustable speed and pitch
- Export to various audio formats

### Speech-to-Text

Transcribe audio files or record directly:
- Support for multiple languages
- Real-time transcription option
- Edit and export transcriptions

## Development

### Project Structure

```
FusionLoom/
├── cfg/                 # Configuration files
├── src/                 # Source code
│   ├── ui/              # UI components
│   ├── services/        # Service integrations
│   ├── containers/      # Container management
│   └── utils/           # Utility functions
├── resources/           # Assets and resources
├── docs/                # Documentation
└── tests/               # Test suite
```

### Building from Source

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Build executable
pyinstaller build.spec
```

## Contributing

Contributions to Fusion Loom are welcome! Please feel free to submit pull requests, create issues or spread the word.

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License 

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Roadmap

- **v1.1**: UI improvements and bug fixes
- **v1.2**: RAG capabilities integration
- **v1.3**: AI Agent support
- **v1.5**: Content management systems (images, documents)
- **v2.0**: Note integration and full ecosystem connectivity

## Acknowledgements

- PyQt6 for the GUI framework
- Podman/Docker for containerization support
- Various AI service providers integrated into the application
- All contributors and community members

## Contact

For any queries or suggestions, please open an issue on this repository.

---

**Fusion Loom - Weaving AI Technologies Into Seamless Solutions**
