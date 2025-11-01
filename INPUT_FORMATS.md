# 📝 Data Type Input Formats

## Overview
The marketplace now supports 4 different data types, each with specific input fields designed to capture the necessary parameters for AI model generation.

---

## 🖼️ IMAGE Generation

### Required Fields:
1. **Prompt*** (Text Area)
   - Description: The main description of the image you want to generate
   - Example: "A photorealistic, wide-angle shot of an astronaut riding a horse on Mars, synthwave style."
   - Purpose: Be as descriptive as possible to guide the AI

2. **Number of Images*** (Slider/Number)
   - Description: How many different images should be generated
   - Range: 1-10
   - Default: 1

3. **Resolution*** (Dropdown)
   - Options:
     - `512x512` (Fast)
     - `1024x1024` (HD)
     - `1920x1080` (Full HD)
   - Default: 512x512

### Optional Fields:
- **Reference Image** (File Upload)
  - Formats: PNG, JPG, JPEG
  - Purpose: Upload an existing image as visual reference for image-to-image generation

### Sample Data Structure:
```json
{
  "prompt": "A photorealistic, wide-angle shot of an astronaut riding a horse on Mars, synthwave style.",
  "referenceImage": "base64_encoded_image_data",
  "numberOfImages": 4,
  "resolution": "1024x1024"
}
```

---

## 📄 TEXT / JSON Generation

### Required Fields:
1. **Prompt / Instruction*** (Text Area)
   - Description: Clear instruction telling the model what to generate
   - Example: "Generate realistic user profiles for a new social media app."

2. **Output Schema (JSON)*** (Code Input)
   - Description: Define the exact JSON structure for each generated item
   - Example:
   ```json
   {
     "user": {
       "name": "str",
       "age": "int",
       "city": "str",
       "interests": ["str"]
     }
   }
   ```
   - Purpose: Crucial for synthetic data structure

3. **Number of Samples*** (Number)
   - Description: How many distinct JSON objects should be generated
   - Example: 10
   - Default: 5

### Optional Fields:
- **Input Data (JSON)** (Code Input)
  - Description: Provide optional structured input data in JSON format
  - Example:
  ```json
  {
    "industries": ["technology", "fashion", "gaming"],
    "regions": ["India", "USA"]
  }
  ```

- **Tone of Voice** (Dropdown)
  - Options: Neutral, Formal, Creative, Technical, Casual
  - Default: Neutral

- **Max Length (Tokens)** (Number)
  - Description: Technical limit to prevent overly long responses
  - Default: 1024

### Sample Data Structure:
```json
{
  "prompt": "Generate realistic user profiles for a new social media app.",
  "inputDataJson": "{\"industries\": [\"technology\", \"fashion\"], \"regions\": [\"India\", \"USA\"]}",
  "outputSchemaJson": "{\"user\": {\"name\": \"str\", \"age\": \"int\", \"city\": \"str\"}}",
  "toneOfVoice": "creative",
  "maxLength": 1024
}
```

---

## 📊 TABULAR / CSV Generation

### Schema Definition Methods:

#### **Method 1: Define Schema Manually***
- UI Component with dynamic rows
- Add/remove columns
- Specify column name and data type for each

**Column Data Types:**
- String
- Integer
- Float
- Boolean
- Date

**Example:**
```
Column 1: user_id (Integer)
Column 2: country (String)
Column 3: purchase_value (Float)
```

#### **Method 2: Upload File with Headers***
- File Upload (.csv or .json)
- System reads headers to define schema
- Example: `my_schema.csv`

### Required Fields:
1. **Schema Definition Method*** (Radio Buttons)
   - Options: Manual / Upload File

2. **Number of Rows to Generate*** (Number)
   - Description: How many rows of synthetic data to generate
   - Example: 5000

### Optional but Highly Recommended:
- **Upload Sample Data** (File Upload)
  - Format: CSV
  - Purpose: AI learns statistical relationships and distributions from sample
  - Recommendation: 100-1000 rows of anonymized real data for realistic results

### Sample Data Structure (Manual Schema):
```json
{
  "schemaDefinitionMethod": "manual",
  "manualSchema": [
    { "columnName": "user_id", "dataType": "integer" },
    { "columnName": "country", "dataType": "string" },
    { "columnName": "purchase_value", "dataType": "float" }
  ],
  "numberOfRows": 5000,
  "sampleDataFile": "base64_encoded_csv_data"
}
```

### Sample Data Structure (Upload Schema):
```json
{
  "schemaDefinitionMethod": "upload",
  "schemaFile": "base64_encoded_schema_file",
  "numberOfRows": 5000,
  "sampleDataFile": "base64_encoded_sample_csv"
}
```

---

## 🎵 AUDIO Generation

### Required Fields:
1. **Text to Synthesize*** (Text Area)
   - Description: The exact text you want the AI to speak
   - Example: "Welcome to the decentralized data marketplace. Your request is now being processed."

2. **Voice / Speaker*** (Dropdown)
   - Options:
     - Male - Deep
     - Female - Professional
     - Narrator - Calm
     - Male - Energetic
     - Female - Friendly
   - Purpose: Select pre-trained voice

### Optional Fields:
- **Emotion / Style** (Dropdown)
  - Options: Neutral, Happy, Sad, Angry, Excited
  - Default: Neutral
  - Purpose: Add emotional style to delivery

- **Speech Rate** (Slider)
  - Range: 0.5x - 2.0x
  - Default: 1.0x
  - Purpose: Control speed of speech

### Sample Data Structure:
```json
{
  "textToSynthesize": "Welcome to the decentralized data marketplace.",
  "voiceSpeaker": "female-professional",
  "emotionStyle": "neutral",
  "speechRate": 1.0
}
```

---

## 🔄 Workflow Integration

### Frontend Form → Sample Data Preparation:
1. User selects data type
2. Dynamic form fields appear
3. User fills in required fields
4. On submit, form data is structured into `sampleData` object
5. Files are converted to base64 encoding

### Backend Processing:
1. **ENDPOINT 1**: `/api/dataset/submit-request`
   - Receives structured `sampleData`
   - Stores for AI model processing

2. **ENDPOINT 2**: `/api/dataset/generate`
   - AI Model receives `sampleData`
   - Generates synthetic dataset based on parameters
   - Returns actual dataset to frontend

3. **ENDPOINT 3**: `/api/dataset/get-report`
   - AI Model compares input specs with generated output
   - Creates QA report with quality metrics
   - Uploads report to IPFS
   - Triggers smart contract escrow logic

---

## 🎯 Key Benefits

### Type-Safe Generation:
- Each data type has specific, validated inputs
- Reduces errors and improves quality
- Clear expectations for AI model

### Flexibility:
- Optional reference data for better results
- Multiple schema definition methods
- Customizable parameters (voice, tone, resolution, etc.)

### Quality Assurance:
- AI model compares input specifications with output
- Validates generated data matches requirements
- Provides detailed QA metrics

---

## 📋 Validation Rules

### Image:
- ✅ Prompt required
- ✅ Number of images: 1-10
- ✅ Resolution must be selected

### Text:
- ✅ Prompt required
- ✅ Output Schema JSON must be valid
- ✅ Number of samples required

### CSV:
- ✅ Schema method selected
- ✅ If manual: All column names filled
- ✅ If upload: Schema file provided
- ✅ Number of rows required

### Audio:
- ✅ Text to synthesize required
- ✅ Voice/Speaker selected

---

**All input formats are now properly integrated with the AI model workflow!** 🚀
