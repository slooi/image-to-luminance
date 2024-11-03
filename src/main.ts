import './style.css'
// source: https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
// source: https://www.w3.org/TR/AERT/#color-contrast

class ClipboardFileListener {
  constructor(callback: (imgData: string | ArrayBuffer) => any) {
    document.addEventListener("paste", async event => {
      const clipboardItems = await navigator.clipboard.read();
      console.log("clipboardItems", clipboardItems)
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types?.filter((type) =>
          type.startsWith("image/")
        );

        for (const imageType of imageTypes) {
          const blob = await clipboardItem.getType(imageType);
          callback(URL.createObjectURL(blob))
        }
      }
    });
  }
}


// Canvas
const canvas = document.createElement('canvas');
const c = canvas.getContext('2d');
if (!c) throw new Error("ERROR: 2d context not supported!")

// ClipboardFileListener
new ClipboardFileListener(imgData => {
  if (typeof imgData !== "string") throw new Error("Error: arraybuffer not supported!")

  const tempImg = document.createElement('img');
  tempImg.src = imgData;
  tempImg.onload = () => {
    console.log("loaded")

    // Size
    canvas.width = tempImg.width;
    canvas.height = tempImg.height;

    // getTransformedImageDataURL(c, tempImg, transformRGBToPerceivedLightnessQuick)
    const transDataUrl = getTransformedImageDataURL(c, tempImg, () => { })
    const oriDataUrl = getTransformedImageDataURL(c, tempImg, transformRGBToPerceivedLightness)


    // Create new image
    const newImage = document.createElement("img")
    const newImage2 = document.createElement("img")
    newImage.src = transDataUrl
    newImage2.src = oriDataUrl

    const shadowContainer = document.createElement("div")
    shadowContainer.classList.add("shadow-container")
    shadowContainer.append(newImage)
    shadowContainer.append(newImage2)

    const container = document.createElement("div")
    container.classList.add("img-container")
    container.append(shadowContainer)

    document.getElementById("content")?.prepend(container)
  }
})

function getTransformedImageDataURL(c: CanvasRenderingContext2D, originalImg: HTMLImageElement, transformFunc: (data: Uint8ClampedArray) => void) {
  // Draw original img then get data
  c.drawImage(originalImg, 0, 0);
  const imageData = c.getImageData(0, 0, canvas.width, canvas.height);

  // Transform then draw
  transformFunc(imageData.data)
  c.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
function transformRGBToPerceivedLightnessQuick(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const grayValue = (0.2126 * r + 0.7152 * g + 0.0722 * b)

    data[i] = grayValue; // Red channel
    data[i + 1] = grayValue; // Green channel
    data[i + 2] = grayValue; // Blue channel
    //data[i + 3] = data[i + 3]; // Alpha (unchanged)
  }
}

function transformRGBToPerceivedLightness(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    // const luma = Math.sqrt(0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2)
    // const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const luma = (0.299 * r + 0.587 * g + 0.114 * b)
    data[i] = luma * 255
    data[i + 1] = luma * 255
    data[i + 2] = luma * 255

    // const perceivedLightness = ColorCorrection.YtoLstar(ColorCorrection.rgbToY(r, g, b))
    // data[i] = perceivedLightness * 255 / 100; // Red channel
    // data[i + 1] = perceivedLightness * 255 / 100; // Green channel
    // data[i + 2] = perceivedLightness * 255 / 100; // Blue channel
    // data[i + 3] = data[i + 3]; // Alpha (unchanged)
  }
}

class ColorCorrection {
  static rgbToY(r: number, g: number, b: number) {
    return 0.2126 * ColorCorrection.sRGBtoLin(r) + 0.7152 * ColorCorrection.sRGBtoLin(g) + 0.0722 * ColorCorrection.sRGBtoLin(b)
  }
  static YtoLstar(Y: number) {
    if (Y <= 0.008856) {
      return Y * 903.3
    } else {
      return Math.pow(Y, 1 / 3) * 116 - 16
    }
  }

  /* PRIVATE */
  private static sRGBtoLin(colorChannel: number) {
    // Send this function a decimal sRGB gamma encoded color value
    // between 0.0 and 1.0, and it returns a linearized value.

    if (colorChannel <= 0.04045) {
      return colorChannel / 12.92;
    } else {
      return Math.pow(((colorChannel + 0.055) / 1.055), 2.4);
    }
  }
}