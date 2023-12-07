
const { DialogBot } = require('./dialogBot');
const { CardFactory } = require('botbuilder');

class DialogAndWelcomeBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

      async sendWelcomeMessage(turnContext) {
                const welcomeCard = CardFactory.adaptiveCard({
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.0",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": "Welcome Back!",
                            "size": "large",
                            "weight": "bolder"
                        },
                        {
                            "type": "TextBlock",
                            "weight": "bolder",
                            "wrap": true,
                            "text": "I'm your **Creatio** virtual assistant. I can help with information about our services."
                        },
                        {
                            "type": "TextBlock",
                            "wrap": true,
                            "text":"You can get started by selecting one of the following topics that best describes your need."
                        }
                    ],
                    "actions": [
                        {
                          "type": "Action.Submit",
                          "title":"List My Approvals",
                          "data": "List My Approvals"
                        },
                        {
                          "type": "Action.OpenUrl",
                          "title": "Visit Us",
                          "url": "https://www.creatio.com"
                          }
                      ]
                });

                await turnContext.sendActivity({
                    attachments: [welcomeCard]
                });
            }
}

module.exports.DialogAndWelcomeBot = DialogAndWelcomeBot;
