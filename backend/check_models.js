require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.map(m => m.name).forEach(name => console.log(name));
    } else {
      console.log("Response:", data);
    }
  })
  .catch(err => console.error(err));
