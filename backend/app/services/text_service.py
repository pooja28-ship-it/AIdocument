def split_text(text: str, max_characters: int = 12000,) -> list[str]:
    text = text.strip()

    if not text:
        return []

    chunks = []

    for start in range(0, len(text), max_characters):
        chunk = text[start:start+max_characters]
        chunk.append(chunk)

    return chunks