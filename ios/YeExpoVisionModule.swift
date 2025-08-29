import CoreImage
import ExpoModulesCore
import ImageIO
import MLKitTextRecognition
import MLKitTextRecognitionChinese
import MLKitTextRecognitionDevanagari
import MLKitTextRecognitionJapanese
import MLKitTextRecognitionKorean
import MLKitVision
import UIKit
import Vision

extension CGImagePropertyOrientation {
  init(_ ui: UIImage.Orientation) {
    switch ui {
    case .up: self = .up
    case .down: self = .down
    case .left: self = .left
    case .right: self = .right
    case .upMirrored: self = .upMirrored
    case .downMirrored: self = .downMirrored
    case .leftMirrored: self = .leftMirrored
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}

extension UIImage.Orientation {
  fileprivate var isRotated90: Bool {
    switch self {
    case .left, .leftMirrored, .right, .rightMirrored: return true
    default: return false
    }
  }
}

private func orientedPixelSize(_ image: UIImage) -> CGSize {
  let size = image.size
  return image.imageOrientation.isRotated90
    ? CGSize(width: size.height, height: size.width)
    : size
}

/// Rotate an ML Kit rect (in `.up` space) into the image’s display orientation.
func rotateUpRectToDisplay(_ r: CGRect, size: CGSize, orientation: UIImage.Orientation) -> CGRect {
  let W = size.width
  let H = size.height

  switch orientation {

  case .down, .downMirrored:
    return CGRect(x: W - r.maxX, y: H - r.maxY, width: r.width, height: r.height)
  case .right, .rightMirrored:
    // 90° CW
    return CGRect(x: H - r.maxY, y: r.minX, width: r.height, height: r.width)
  case .left, .leftMirrored:
    // 90° CCW
    return CGRect(x: r.minY, y: H - r.maxX, width: r.height, height: r.width)
  default:
    return r
  }
}

func rectToMap(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) -> [String: Any] {
  return [
    "x": x, "y": y, "width": width, "height": height,
  ]
}

func processFrame(_ frame: CGRect, uiImage: UIImage) -> [String: Any] {
  let orientedSize = orientedPixelSize(uiImage)
  let upSize = uiImage.size
  let r = rotateUpRectToDisplay(frame, size: orientedSize, orientation: uiImage.imageOrientation)

  // normalize coords with upSize and y to bottom-left
  let x = r.minX / upSize.width
  let y = (upSize.height - r.maxY) / upSize.height
  let w = r.width / upSize.width
  let h = r.height / upSize.height

  return [
    "x": x, "y": y, "width": w, "height": h,
    "frame": rectToMap(x: frame.minX, y: frame.minY, width: frame.width, height: frame.height),
    "rotated": rectToMap(x: r.minX, y: r.minY, width: r.width, height: r.height),
    "W": upSize.width, "H": upSize.height,
    "oW": orientedSize.width, "oH": orientedSize.height,
  ]
}

public class YeExpoVisionModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('YeExpoVision')` in JavaScript.
    Name("YeExpoVision")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("getSupportedLanguages") {
      // current revision number of Vision
      let revision = VNRecognizeTextRequest.currentRevision
      var possibleLanguages: [String] = []

      do {
        possibleLanguages = try VNRecognizeTextRequest.supportedRecognitionLanguages(
          for: .accurate,
          revision: revision)
      } catch {
        print("Error getting the supported languages.")
      }

      return possibleLanguages
    }

    // Text recognition function using iOS Vision API
    AsyncFunction("recognizeTextIOS") {
      (imageUri: String, options: [String: Any], promise: Promise) in
      self.recognizeTextIOS(imageUri: imageUri, options: options, promise: promise)
    }

    // Text recognition function using Google ML Kit
    AsyncFunction("recognizeTextMLKit") {
      (imageUri: String, script: String, promise: Promise) in
      self.recognizeTextMLKit(imageUri: imageUri, script: script, promise: promise)
    }
  }

  private func recognizeTextIOS(imageUri: String, options: [String: Any], promise: Promise) {
    guard let url = URL(string: imageUri),
      let imageData = try? Data(contentsOf: url),
      let image = UIImage(data: imageData),
      let cgImage = image.cgImage
    else {
      promise.reject("INVALID_IMAGE", "Could not load image from URI")
      return
    }

    let recognitionLevel = options["recognitionLevel"] as? String ?? "accurate"
    let recognitionLanguages = options["recognitionLanguages"] as? [String] ?? []
    let automaticallyDetectsLanguage = options["automaticallyDetectsLanguage"] as? Bool ?? false
    let usesLanguageCorrection = options["usesLanguageCorrection"] as? Bool ?? true

    // english language
    let orientation = CGImagePropertyOrientation(image.imageOrientation)

    let requestHandler = VNImageRequestHandler(
      cgImage: cgImage,
      orientation: orientation,
      options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
      if let error = error {
        promise.reject("VISION_ERROR", error.localizedDescription)
        return
      }

      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        promise.reject("NO_TEXT_FOUND", "No text observations found")
        return
      }

      var textBlocks: [[String: Any]] = []

      for observation in observations {
        guard let topCandidate = observation.topCandidates(1).first else { continue }

        let r = observation.boundingBox  // normalized [0,1], origin bottom-left
        let textBlock: [String: Any] = [
          "text": topCandidate.string,
          "confidence": topCandidate.confidence,
          "boundingBox": ["x": r.minX, "y": r.minY, "width": r.width, "height": r.height],
          "languages": [],
        ]

        textBlocks.append(textBlock)
      }

      promise.resolve(textBlocks)
    }

    request.recognitionLevel = recognitionLevel == "fast" ? .fast : .accurate
    request.usesLanguageCorrection = usesLanguageCorrection
    if !recognitionLanguages.isEmpty {
      request.recognitionLanguages = recognitionLanguages
    }
    request.automaticallyDetectsLanguage = automaticallyDetectsLanguage

    do {
      try requestHandler.perform([request])
    } catch {
      promise.reject("VISION_REQUEST_FAILED", error.localizedDescription)
    }
  }

  private func recognizeTextMLKit(imageUri: String, script: String, promise: Promise) {
    guard let url = URL(string: imageUri),
      let imageData = try? Data(contentsOf: url),
      let uiImage = UIImage(data: imageData)
    else {
      promise.reject("INVALID_IMAGE", "Could not load image from URI")
      return
    }

    let visionImage = VisionImage(image: uiImage)
    visionImage.orientation = uiImage.imageOrientation

    let textRecognizer = getMLKitTextRecognizer(script: script)

    textRecognizer.process(visionImage) { result, error in
      if let error = error {
        promise.reject("MLKIT_ERROR", error.localizedDescription)
        return
      }

      guard let result = result else {
        promise.reject("NO_TEXT_FOUND", "No text recognition result")
        return
      }

      var out: [[String: Any]] = []

      for block in result.blocks {
        for line in block.lines {
          let bb = processFrame(line.frame, uiImage: uiImage)
          let orientation = self.orientationToString(orientation: uiImage.imageOrientation)
          out.append([
            "text": line.text, "confidence": 0, "boundingBox": bb, "orientation": orientation,
            "languages": line.recognizedLanguages.map { $0.languageCode },
          ])
        }
      }

      promise.resolve(out)
    }
  }

  private func getMLKitTextRecognizer(script: String) -> TextRecognizer {
    switch script {
    case "chinese": return TextRecognizer.textRecognizer(options: ChineseTextRecognizerOptions())
    case "korean": return TextRecognizer.textRecognizer(options: KoreanTextRecognizerOptions())
    case "japanese": return TextRecognizer.textRecognizer(options: JapaneseTextRecognizerOptions())
    case "devanagari":
      return TextRecognizer.textRecognizer(options: DevanagariTextRecognizerOptions())
    default: return TextRecognizer.textRecognizer(options: TextRecognizerOptions())
    }
  }

  private func orientationToString(orientation: UIImage.Orientation) -> String {
    switch orientation {
    case .up: return "up"
    case .down: return "down"
    case .left: return "left"
    case .right: return "right"
    default: return "unknown"
    }
  }
}
