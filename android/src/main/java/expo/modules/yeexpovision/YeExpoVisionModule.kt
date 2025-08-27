package expo.modules.yeexpovision

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.net.URL

class YeExpoVisionModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('YeExpoVision')` in JavaScript.
    Name("YeExpoVision")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // Text recognition function - empty implementation for Android
    AsyncFunction("recognizeText") { imageUri: String ->
      // Empty implementation - return empty array for Android
      emptyList<Map<String, Any>>()
    }

    // Text recognition function using Google ML Kit
    AsyncFunction("recognizeTextInImageMLKit") { imageUri: String, promise: Promise ->
      recognizeTextInImageMLKit(imageUri, promise)
    }
  }

  private fun recognizeTextInImageMLKit(imageUri: String, promise: Promise) {
    try {
      val url = URL(imageUri)
      val inputStream = url.openConnection().getInputStream()
      val bitmap = BitmapFactory.decodeStream(inputStream)
      
      if (bitmap == null) {
        promise.reject("INVALID_IMAGE", "Could not load image from URI", null)
        return
      }

      val image = InputImage.fromBitmap(bitmap, 0)
      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

      recognizer.process(image)
        .addOnSuccessListener { visionText ->
          val textBlocks = mutableListOf<Map<String, Any>>()
          val imageWidth = bitmap.width.toFloat()
          val imageHeight = bitmap.height.toFloat()

          for (block in visionText.textBlocks) {
            // ML Kit uses top-left origin coordinates in pixels
            // Convert to normalized coordinates with bottom-left origin to match Vision API
            val boundingBox = block.boundingBox
            if (boundingBox != null) {
              // Normalize coordinates [0,1]
              val normalizedX = boundingBox.left / imageWidth
              val normalizedY = (imageHeight - boundingBox.bottom) / imageHeight // Flip Y axis
              val normalizedWidth = boundingBox.width() / imageWidth
              val normalizedHeight = boundingBox.height() / imageHeight

              val textBlock = mapOf(
                "text" to block.text,
                "confidence" to 1.0f, // ML Kit doesn't provide confidence at block level, use 1.0
                "boundingBox" to mapOf(
                  "x" to normalizedX,
                  "y" to normalizedY,
                  "width" to normalizedWidth,
                  "height" to normalizedHeight
                )
              )

              textBlocks.add(textBlock)
            }
          }

          promise.resolve(textBlocks)
        }
        .addOnFailureListener { e ->
          promise.reject("MLKIT_ERROR", e.message, e)
        }
    } catch (e: Exception) {
      promise.reject("IMAGE_LOAD_ERROR", e.message, e)
    }
  }
}
