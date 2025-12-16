### Controllers
[Account Controller](../server/controllers/accountController.js)  
[Audit Controller](../server/controllers/auditController.js)  
[Auth Controller](../server/controllers/authController.js)      
[Redact Controller](../server/controllers/redactController.js)    
[Summary Controller](../server/controllers/summaryController.js)    

### Routes
[Account Routes](../server/routes/accountRoutes.js)  
[Audit Routes](../server/routes/auditRoutes.js)  
[Auth Routes](../server/routes/authRoutes.js)  
[Config Routes](../server/routes/configRoutes.js)  
[Redact Routes](../server/routes/redactRoutes.js)  
[Session Routes](../server/routes/sessionRoutes.js)  
[Summary Routes](../server/routes/summaryRoutes.js)  
[Upload Routes](../server/routes/uploadRoutes.js)  

### Models  
[Account Model](../server/models/Account.js)  
[Audit Log Model](../server/models/AuditLog.js)  
[Summary Model](../server/models/Summary.js)  

### Data Flow
- The user creates a request by uploading text and clicking the "Redact and Summarize" Button.
- The request is routed and sent to OpenAI or to the local LLM.
- The request is processed by the LLM, confidential information is redacted, and the note is converted into a summary.
- The LLM responds to the user's request with the completed summary.

### Diagram
[Frontend](../official/frontend_architecture.md)   

### Narrative
1. The user submits a doctor note into the system.
2. If the note is not a real doctor note, throw a non-doctor note error. Otherwise, continue on to step 3.
3. Redact confidential information from the submitted text.
4. Summarize the doctor note. 
5. Format the output to include additional information such as allergies.
6. Output the summarized doctor note to the output box of the summarizer page.
7. The Audit Log reports that the user has generated a summary.