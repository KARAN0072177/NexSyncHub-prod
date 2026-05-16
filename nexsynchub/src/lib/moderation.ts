import {
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

import { rekognition }
  from "./rekognition";

// 🔥 Blocked moderation labels
const BLOCKED_LABELS = [

  "Explicit Nudity",

  "Graphic Nudity",

  "Sexual Activity",

  "Graphic Violence",

];

// 🔥 Confidence threshold
const MIN_CONFIDENCE = 80;

export async function moderateImage(
  imageBuffer: Buffer
) {

  try {

    // 🔥 Detect labels
    const response =
      await rekognition.send(

        new DetectModerationLabelsCommand({

          Image: {

            Bytes:
              imageBuffer,

          },

          MinConfidence:
            MIN_CONFIDENCE,

        })

      );

    const labels =
      response.ModerationLabels || [];

    // 🔥 Unsafe detection
    const unsafe =
      labels.some(
        (label) =>

          BLOCKED_LABELS.includes(
            label.Name || ""
          )
      );

    return {

      safe: !unsafe,

      labels,

    };

  } catch (error) {

    console.error(
      "MODERATION ERROR:",
      error
    );

    return {

      safe: false,

      labels: [],

    };

  }

}