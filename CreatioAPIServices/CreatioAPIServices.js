
const axios = require('axios');
const AuthObject = require('../FlowObjects/AuthObject');
const sampleresponses = require('../Data/SampleResponse.json');

const CreatioApiServices = {

    async GetCookie() {
        const url = 'https://140790-crm-bundle.creatio.com/ServiceModel/AuthService.svc/Login';
        const requestBody = JSON.stringify({
            UserName: 'Supervisor',
            UserPassword: 'Ashwath@2k',
        });

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            'ForceUseSession': true
        };
        try {
            const response = await axios.post(url, requestBody, { headers });
            const responseheaders = response.headers;
            const setcookie = responseheaders['set-cookie'];
            return setcookie;
        } catch (error) {
            console.log(error);
            return 'An error occurred during the request.';
        }
    },

    GetBpmcsrfValue(cookie){
            let bpmCsrfValue = null;
            for (const cookieValue of cookie) {
                if (cookieValue.startsWith('BPMCSRF=')) {
                    bpmCsrfValue = cookieValue.split('=')[1].split(';')[0];
                    break;
                }
            }
            return bpmCsrfValue;
    },

    async GetApprovalList(BPMCSRF,cookiesString) {
        const url = "https://140790-crm-bundle.creatio.com/0/rest/VisaDataService/GetVisaEntities";
        let requestbody = JSON.stringify({
                "sysAdminUnitId": "7f3b869f-34f3-4f20-ab4d-7480a5fdf647",
                "requestOptions": {
                    "isPageable": true,
                    "rowCount": 16,
                    "ownerRoleSources": 63
                }
          });
        let config = {
            method: 'Post',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ForceUseSession': 'true',
                'BPMCSRF': AuthObject.bpmcsrf,
                'Cookie': AuthObject.cookiestring
            },
            data : requestbody
        };
        try {
            const response = await axios.request(config);
            if (response.status === 200) {
                return response.data;
            } else {
                console.log(`Request failed with status code: ${response.status}`);
                return 'Failed';
            }
        } catch (error) {
            console.log(error);
            return 'An error occurred during the request.';
        }
    },

    async InitiateUserAction(BPMCSRF,cookiesString,useraction,Id) {
        const url = `https://140790-crm-bundle.creatio.com/0/rest/ApprovalService/${useraction}`;
        let requestbody = JSON.stringify({
            "request": {
              "id": Id,
              "schemaName": "SysApproval",
              "additionalColumnValues": [
                {
                  "Key": "Comment",
                  "Value": ""
                }
              ]
            }
          });
        let config = {
            method: 'Post',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ForceUseSession': 'true',
                'BPMCSRF': BPMCSRF,
                'Cookie': cookiesString
            },
            data : requestbody
        };
        try {
            const response = await axios.request(config);
            if (response.status === 200) {
                console.log(response.data);
                return response.data;
            } else {
                console.log(`Request failed with status code: ${response.status}`);
                return 'Failed';
            }
        } catch (error) {
            console.log(error);
            return 'An error occurred during the request.';
        }
    },

    async GetSelectedApprovalData(BPMCSRF,cookiesString,SelectedApproval,requestfields) {
        const url = this.ConstructRequestUrl(SelectedApproval,requestfields);
        console.log(url);
        // const url = `https://139261-crm-bundle.creatio.com/0/odata/${SelectedApproval.SchemaName}(${SelectedApproval.VisaObjectId})?$expand=Stage($select=Name),Type($select=Name)`;
        let config = {
            method: 'Get',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ForceUseSession': 'true',
                'BPMCSRF':BPMCSRF,
                'Cookie': cookiesString
            }
        };
        try {
            const response = await axios.request(config);
            if (response.status === 200) {
                return response.data;
            } else {
                console.log(`Request failed with status code: ${response.status}`);
                return 'Failed';
            }
        } catch (error) {
            console.log(error);
            return 'An error occurred during the request.';
        }
    },

    ConstructRequestUrl(SelectedApproval,requestfields) {
            const expandString = requestfields
                .filter(field => field.includes('.'))
                .map(field => {
                    const [navigationProperty, nestedField] = field.split('.');
                    return `${navigationProperty}($select=${nestedField})`;
                })
                .join(',');
            const selectString = requestfields
                .filter(field => !field.includes('.'))
                .join(',');
            const url = `https://140790-crm-bundle.creatio.com/0/odata/${SelectedApproval.SchemaName}(${SelectedApproval.VisaObjectId})?$expand=${expandString} & $select=${selectString}`;
            return url;
    }
};

module.exports = CreatioApiServices;
