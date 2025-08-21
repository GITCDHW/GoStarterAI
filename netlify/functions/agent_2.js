const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_ORCHESTRATOR_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash-preview-image-generation" });

exports.handler = async (event, context) => {
  
  try {
    const { prompt } = JSON.parse(event.body);
    
    // This is where you make the actual API call to generate the image
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const imageParts = response.candidates[0].content.parts.filter(part => part.inlineData);
    
    // Check if an image was generated
    if (imageParts.length > 0) {
      const imageData = imageParts[0].inlineData.data;
      const mimeType = imageParts[0].inlineData.mimeType;
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Logo generated successfully.",
          image: {
            data: imageData,
            mimeType: mimeType
          }
        })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Image generation failed. No image data returned." })
      };
    }
  } catch (error) {
    // If an error occurs, log it and send a clear error message
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "An internal server error occurred." })
    };
  }
};