import './style.css'
// https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
class ClipboardFileListener {
  constructor(callback: (imgData: string | ArrayBuffer) => any) {
    document.addEventListener("paste", event => {
      const items = event.clipboardData?.items;
      let notFileCounter = 0
      console.log("items", items);

      // Correct iteration using a for loop
      if (!items) throw new Error("Error: no items found")

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log("item", item);

        if (item.kind === 'file') {
          console.log("item", item);
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = e => {
            if (!e.target?.result) throw new Error("Error: file format not supported")
            callback(e.target?.result)
          }
          reader.onerror = e => { throw new Error(`${e}`) }

          if (!blob) throw new Error("Error: blob was null")
          reader.readAsDataURL(blob);
        } else {
          notFileCounter++
        }
      }

      if (notFileCounter === items.length) throw new Error("No image/file found")
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

    // drawTransformedImage(c, tempImg, transformRGBToPerceivedLightnessQuick)
    drawTransformedImage(c, tempImg, () => { })
    drawTransformedImage(c, tempImg, transformRGBToPerceivedLightness)
  }
})

function drawTransformedImage(c: CanvasRenderingContext2D, originalImg: HTMLImageElement, transformFunc: (data: Uint8ClampedArray) => void) {
  // Draw original img then get data
  c.drawImage(originalImg, 0, 0);
  const imageData = c.getImageData(0, 0, canvas.width, canvas.height);

  // Transform then draw
  transformFunc(imageData.data)
  c.putImageData(imageData, 0, 0);


  // Create new image
  const newImage = document.createElement("img")
  const container = document.createElement("div")
  newImage.src = canvas.toDataURL();
  container.classList.add("img-container")
  container.append(newImage)
  document.getElementById("content")?.prepend(container)
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
    const rHat = data[i] / 255
    const gHat = data[i + 1] / 255
    const bHat = data[i + 2] / 255

    const perceivedLightness = ColorCorrection.YtoLstar(ColorCorrection.rgbToY(rHat, gHat, bHat))

    data[i] = perceivedLightness * 255 / 100; // Red channel
    data[i + 1] = perceivedLightness * 255 / 100; // Green channel
    data[i + 2] = perceivedLightness * 255 / 100; // Blue channel
    //data[i + 3] = data[i + 3]; // Alpha (unchanged)
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