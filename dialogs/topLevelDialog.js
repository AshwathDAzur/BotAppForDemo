const { 
    ComponentDialog,
    NumberPrompt, 
    TextPrompt, 
    WaterfallDialog, 
    ConfirmPrompt } = require('botbuilder-dialogs');

const { CardFactory } = require('botbuilder');

const TOP_LEVEL_DIALOG = 'TOP_LEVEL_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';

const CreatioApiServices = require('../CreatioAPIServices/CreatioApiServices');
const AuthObject = require('../FlowObjects/AuthObject');
var Approvals = "";
var SelectedApproval = "";
var SelectedApprovalInfo = "";
const AppFields = require('../Data/ApprovalFields.json');

class TopLevelDialog extends ComponentDialog {
   constructor() {
       super(TOP_LEVEL_DIALOG);
       this.addDialog(new TextPrompt(TEXT_PROMPT));
       this.addDialog(new NumberPrompt(NUMBER_PROMPT));
       this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
       this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
           this.AuthorizationStep.bind(this),
           this.InitiateListApprovalStep.bind(this),
           this.GetApprovalChoice.bind(this),
           this.DisplaySelectedApproval.bind(this),
           this.InitiateApprovalActionStep.bind(this)
       ]));

       this.initialDialogId = WATERFALL_DIALOG;
   }

   async AuthorizationStep(stepContext) {
       AuthObject.cookie = await CreatioApiServices.GetCookie();
       if(AuthObject.cookie)
       {
           AuthObject.cookiestring = AuthObject.cookie.join(';');
           AuthObject.bpmcsrf = await CreatioApiServices.GetBpmcsrfValue(AuthObject.cookie);
           return await stepContext.next();
       }
       else
       {
           return await stepContext.endDialog();
       }
   }

   async InitiateListApprovalStep(stepContext) {
       const response = await CreatioApiServices.GetApprovalList(AuthObject.bpmcsrf,AuthObject.cookiestring);
       const result = JSON.parse(response.GetVisaEntitiesResult);
       Approvals = result.rows;
       if (Approvals && Approvals.length > 0) 
       {
         await this.DisplayApprovalList(stepContext);
         return await stepContext.next();
       }
       else
       {
           await stepContext.context.sendActivity('No Approvals/Activities found.');
           return await stepContext.endDialog();
       }
   }

   async DisplayApprovalList(stepContext) {
           const card = this.ApprovalCard();
           const message = { type: 'message', attachments: [card] };
           await stepContext.context.sendActivity("Listing your Approvals");
           await stepContext.context.sendActivity(message);
   }

   ApprovalCard() {
       const body = Approvals.map(App => ({
           "type": "ActionSet",
           "actions": [
               {
                   "type": "Action.Submit",
                   "title": App.Title,
                   "data": App.Title
               }
           ]
       }));
       const adaptiveCard = CardFactory.adaptiveCard({
           "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
           "type": "AdaptiveCard",
           "version": "1.0",
           "body": body,
       });
       return adaptiveCard;
   }

   async GetApprovalChoice (stepContext) {
       const promptOptions = { prompt: 'Select the Approval/Activity' };
       return await stepContext.prompt(TEXT_PROMPT, promptOptions);
   }

   async DisplaySelectedApproval (stepContext) {
       Approvals.forEach(Approval => {
           if(Approval.Title == stepContext.result)
           {
               SelectedApproval = Approval;
           }
       });
       if(SelectedApproval==="")
       {
           return await stepContext.context.sendActivity(`No approval found in the name **${stepContext.result}**`);
       }
       else
       {
       //Const AppFields = await CreatioApiServices.GetAppFields(); //
       const requestfields = this.GetRespectiveRequestFields(AppFields); // Simulated the api call
       SelectedApprovalInfo = await CreatioApiServices.GetSelectedApprovalData(
           AuthObject.bpmcsrf,
           AuthObject.cookiestring,
           SelectedApproval,
           requestfields
           );
       const card = this.CreateApprovalActionCard(requestfields);
       const message = { type: 'message', attachments: [card] };
       await stepContext.context.sendActivity(message);
       const promptOptions = { prompt: `How can I help you with **${SelectedApproval.Title}** Approval` };
       return await stepContext.prompt(TEXT_PROMPT, promptOptions);
       }
   }

   GetRespectiveRequestFields(AppFields) {
       let fields = null; 
       AppFields.forEach(App => {
           if (App.Schema === SelectedApproval.SchemaName) {
               fields = App.Fields;
           }
       });
       return fields;
   }
   

   CreateApprovalActionCard(requestfields) {
       const CreatedDate = SelectedApproval.CreatedOn.split('T')[0];
       // const DueDate = SelectedApprovalInfo.DueDate.split('T')[0];
       const facts = requestfields.map(field => {
           const [propertyName, subPropertyName] = field.split('.'); 
           const title = `${propertyName}:`;
           const value = `${subPropertyName ? SelectedApprovalInfo[propertyName][subPropertyName] : SelectedApprovalInfo[propertyName]}`;
           return { title, value };
       });
       console.log(facts);

       const adaptiveCard = CardFactory.adaptiveCard({
           "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
           "type": "AdaptiveCard",
           "version": "1.0",
           "body": [
             {
               "type": "Container",
               "items": [
                 {
                   "type": "TextBlock",
                   "text": `**${SelectedApproval.Objective}**`,
                   "weight": "bolder",
                   "size": "medium"
                 },
                 {
                   "type": "ColumnSet",
                   "columns": [
                     {
                       "type": "Column",
                       "width": "auto",
                       "items": [
                         {
                           "type": "Image",
                           "url": "https://yt3.googleusercontent.com/ytc/APkrFKZgACbg3OJRRbl57caawHXmEgr0x03BoW1XMZJudg=s900-c-k-c0x00ffffff-no-rj",
                           "altText": "Creatio",
                           "size": "small",
                           "style": "person"
                         }
                       ]
                     },
                     {
                       "type": "Column",
                       "width": "stretch",
                       "items": [
                         {
                           "type": "TextBlock",
                           "text": `${SelectedApproval.Title}`,
                           "weight": "bolder",
                           "wrap": true
                         },
                         {
                           "type": "TextBlock",
                           "spacing": "none",
                           "text": `Approval date : ${CreatedDate}`,
                           "isSubtle": true,
                           "wrap": true
                         }
                       ]
                     }
                   ]
                 }
               ]
             },
             {
               "type": "Container",
               "items": [
                 {
                   "type": "Container",
                   "items": [
                     {
                       "type": "TextBlock",
                       "text": `**${SelectedApproval.SchemaName} Details**`,
                       "wrap": true
                     },
                     {
                       "type": "FactSet",
                       "facts": facts
                     }
                   ]
                 }
               ]
             }
           ],
           "actions": [
             {
               "type": "Action.Submit",
               "title": "Approve",
               "style": "positive",
               "data": "Approve"
             },
             {
               "type": "Action.ShowCard",
               "title": "Reject",
               "style": "destructive",
               "card": {
                 "type": "AdaptiveCard",
                 "body": [
                   {
                     "type": "Input.Text",
                     "id": "comment",
                     "isMultiline": true,
                     "placeholder": "Are you sure you want to reject the approval?"
                   }
                 ],
                 "actions": [
                   {
                     "type": "Action.Submit",
                     "title": "Reject",
                     "data": "Reject"
                   },
                   {
                     "type": "Action.Submit",
                     "title": "Cancel",
                     "data": "cancel"
                   }
                 ]
               }
             }
           ]
         });
       return adaptiveCard;
   }

   async InitiateApprovalActionStep(stepContext) {
       const userchoice = stepContext.result;
       switch(userchoice)
       {
           case "Approve":
               const approveresponse = await CreatioApiServices.InitiateUserAction(AuthObject.bpmcsrf,AuthObject.cookiestring,userchoice,SelectedApproval.Id);
               if(approveresponse.ApproveResult)
               {
                   await stepContext.context.sendActivity(`${SelectedApproval.Title}-**Approved** successfully`);   
               }
               else
               {
                   await stepContext.context.sendActivity(`${SelectedApproval.Title}-approval **Failed**`);   
               }
               break;
           case "Reject":
               const rejectresponse = await CreatioApiServices.InitiateUserAction(AuthObject.bpmcsrf,AuthObject.cookiestring,userchoice,SelectedApproval.Id);
               if(rejectresponse.RejectResult)
               {
                   await stepContext.context.sendActivity(`${SelectedApproval.Title}-**Rejected** successfully`);   
               }
               else
               {
                   await stepContext.context.sendActivity(`${SelectedApproval.Title}-Rejection **Failed**`);   
               }
               break;
           case "cancel":
               await stepContext.context.sendActivity("**Task Aborting...**");
               break;
           default:
               await stepContext.context.sendActivity("**Task Aborting...**");
               break;
       }
      return await stepContext.next();
   }
}

module.exports.TopLevelDialog = TopLevelDialog;
module.exports.TOP_LEVEL_DIALOG = TOP_LEVEL_DIALOG;
