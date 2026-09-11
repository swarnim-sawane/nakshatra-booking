from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "brand"
MARK_PATH = BRAND_DIR / "kundli-mark-master.png"
FONT_PATH = Path("C:/Windows/Fonts/times.ttf")

CANVAS_SIZE = (1600, 400)
MARK_HEIGHT = 208
MARK_WORD_GAP = 52
WORDMARK = "Nakshatra"
INK = (28, 25, 21, 255)
FOREST = (47, 93, 80, 255)
OCHRE = (169, 120, 53, 255)
IVORY = (247, 243, 234, 255)


def recolour_mark(mark: Image.Image, line_colour: tuple[int, int, int, int], monochrome: bool) -> Image.Image:
    pixels = mark.load()
    for y in range(mark.height):
        for x in range(mark.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue

            is_bindu = red > green * 1.15 and red > blue * 1.5
            colour = line_colour if monochrome or not is_bindu else OCHRE
            pixels[x, y] = (*colour[:3], alpha)
    return mark


def build_lockup(file_name: str, line_colour: tuple[int, int, int, int], monochrome: bool = False) -> None:
    source = Image.open(MARK_PATH).convert("RGBA")
    bounds = source.getbbox()
    if bounds is None:
        raise ValueError("Kundli source mark is empty")

    mark = source.crop(bounds)
    mark_width = round(mark.width * (MARK_HEIGHT / mark.height))
    mark = mark.resize((mark_width, MARK_HEIGHT), Image.Resampling.LANCZOS)
    mark = recolour_mark(mark, line_colour, monochrome)

    font = ImageFont.truetype(str(FONT_PATH), 190)
    measure = Image.new("RGBA", (1, 1))
    measure_draw = ImageDraw.Draw(measure)
    text_bounds = measure_draw.textbbox((0, 0), WORDMARK, font=font)
    text_width = text_bounds[2] - text_bounds[0]
    text_height = text_bounds[3] - text_bounds[1]

    group_width = mark_width + MARK_WORD_GAP + text_width
    group_x = round((CANVAS_SIZE[0] - group_width) / 2)
    mark_y = round((CANVAS_SIZE[1] - MARK_HEIGHT) / 2)
    text_x = group_x + mark_width + MARK_WORD_GAP - text_bounds[0]
    text_y = round((CANVAS_SIZE[1] - text_height) / 2) - text_bounds[1]

    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(mark, (group_x, mark_y))
    ImageDraw.Draw(canvas).text((text_x, text_y), WORDMARK, font=font, fill=line_colour)
    canvas.save(BRAND_DIR / file_name, optimize=True)


def main() -> None:
    build_lockup("nakshatra-horizontal-dark.png", INK)
    build_lockup("nakshatra-horizontal-reversed.png", IVORY)
    build_lockup("nakshatra-horizontal-monochrome.png", INK, monochrome=True)


if __name__ == "__main__":
    main()
