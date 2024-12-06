// import * as faceapi from "face-api.js";

// /**
//  * Load models required for face detection.
//  * @param modelPath - Path to the directory containing face-api.js models.
//  */
// export const loadFaceDetectionModels = async (modelPath: string) => {
//     try {
//         await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
//         console.log("Face detection models loaded.");
//     } catch (error) {
//         console.error("Error loading face detection models:", error);
//     }
// };

// /**
//  * Detect faces in a video element.
//  * @param videoElement - HTMLVideoElement to analyze.
//  * @returns Array of face detections.
//  */
// export const detectFaces = async (videoElement: HTMLVideoElement) => {
//     try {
//         if (!videoElement) return [];
//         const detections = await faceapi.detectAllFaces(
//             videoElement,
//             new faceapi.TinyFaceDetectorOptions()
//         );
//         console.log("Detected faces:", detections);
//         return detections;
//     } catch (error) {
//         console.error("Error detecting faces:", error);
//         return [];
//     }
// };

import * as faceapi from "face-api.js";

/**
 * Loads the face detection models.
 * @param modelPath - Path to the folder containing model files.
 */
export const loadFaceDetectionModels = async (modelPath: string) => {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        console.log("Models loaded successfully.");
    } catch (error) {
        console.error("Error loading face detection models:", error);
        throw error;
    }
};

/**
 * Detects faces in a video element.
 * @param video - The video element to analyze.
 * @returns An array of detected faces.
 */
export const detectFaces = async (video: HTMLVideoElement) => {
    try {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
        console.log("Faces detected:", detections.length);
        return detections;
    } catch (error) {
        console.error("Error detecting faces:", error);
        return [];
    }
};
