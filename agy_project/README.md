# Agy Minimal Template

This is a minimal Agy project template demonstrating a simple text
classification flow.

## What it does

The flow classifies input text into predefined categories using an LLM. It's a
starting point for building your own agent workflows.

## Getting Started

1. Copy `.env.example` to `.env` and add your API key:

   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

2. Run the flow:

   ```bash
   python main.py
   ```

## Next Steps for Agent Developers

- **Customize the flow**: Edit `example_flow.agy.yaml` to add more nodes and
  actions
- **Adjust prompts**: Modify `prompts/example_instruction.md` to change
  classification behavior
- **Add your data**: Place your input files in the `data/` directory
- **Extend context**: Update `objects/example_context.py` to add custom data
  structures

For more information, see the
[Agy documentation](https://github.com/your-repo/agy).
