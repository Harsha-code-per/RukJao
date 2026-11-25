# Problem statement alignment

The brief asks for a **smart, dynamic assistant** with **logical decision making based on user context**, **practical real-world usability** and **clean, maintainable code**. Here is how each part maps.

| Brief | RukJao |
|---|---|
| A genuine problem | Message scams (fake KYC, "digital arrest", UPI PIN tricks, fake jobs, prize fees) drain savings across India every day, and the victims are often people least able to spot them |
| Smart assistant | A rule engine with 16 signals plus a link checker, then a Gemini review that explains in plain English or Hindi and catches what rules miss |
| Dynamic | The same message gives a different plan for different people and situations. Nothing is a fixed FAQ. |
| Decision making on user context | `chooseSteps` orders the plan by: **what you already did** (paid → call 1930 first, shared an OTP → block the bank first), then **the trick** (digital arrest → "no such thing in Indian law"), then **who you are** (elder → show family; shopkeeper → a PIN never receives money), then **how it arrived** (call → hang up; SMS → report on Chakshu). `isUrgent` raises a red "call 1930" bar only when money or secrets have already left. |
| Logical and safe | Hard signals decide alone; the AI may only make the verdict stricter; every step points to an official channel (1930, cybercrime.gov.in, Sanchar Saathi Chakshu, the number on your own card) |
| Practical, real-world | Works in seconds on a phone. Four one-tap examples. Hindi answers. "Warn my family" shares the warning to a WhatsApp group. It keeps working with the AI down. It stores nothing personal. |
| Working prototype | Deployed on Google Cloud Run with Firestore (pattern counts) and Gemini, not a mock-up |

## Example decisions

| Message | Context | First step RukJao gives |
|---|---|---|
| "Scan this QR to receive the refund, enter UPI PIN" | Shopkeeper, nothing done yet | Don't reply or call back. Then: a PIN never receives money |
| "CBI officer, parcel with drugs, digital arrest" | Phone call, already paid | Call 1930 now. Then the bank, then cybercrime.gov.in, then "no digital arrest exists" and hang up |
| "Your KYC expires today, update at bit.ly/…" | Elder, opened the link | Close the page. Change passwords. Banks never ask for KYC by link. Show a family member |
| "Reached home safely, call later" | Any | Looks okay. Confirm through an official channel before paying anyone |
