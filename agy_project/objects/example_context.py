"""Example context class for AGY flows."""


class ExampleContext:
    """Example context object for demonstrating AGY flows."""

    def __init__(self, text: str):
        """
        Initialize context with text.

        Args:
            text: The text content to process
        """
        self.text = text
        self.processing_log: list[str] = []

    def log(self, message: str) -> None:
        """Log a processing step."""
        print(f"[LOG] {message}")
        self.processing_log.append(message)

    def get_summary(self) -> str:
        """Get a summary of processing steps."""
        return "\n".join(self.processing_log)
