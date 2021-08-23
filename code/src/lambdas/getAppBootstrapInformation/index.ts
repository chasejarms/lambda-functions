import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import { IDefaultPrimaryTableModel } from "../../models/database/defaultPrimaryTableModel";
import { ICompanyInformation } from "../../models/database/companyInformation";
import { IUser } from "../../models/database/user";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { queryAllItemsFromPartitionInPrimaryTable } from "../../dynamo/primaryTable/queryAllItemsFromPartition";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { batchGetItemsInPrimaryTable } from "../../dynamo/primaryTable/batchGetItems";
import { createCompanyInformationKey } from "../../keyGeneration/createCompanyInformationKey";
import { createAllCompaniesKey } from "../../keyGeneration/createAllCompaniesKey";
import { createInternalUserKey } from "../../keyGeneration/createInternalUserKey";
import { IInternalUser } from "../../models/database/internalUser";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { createAllInternalUsersKey } from "../../keyGeneration/createAllInternalUsersKey";

export const getAppBootstrapInformation = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const userSub = userSubFromEvent(event);
    if (userSub === "") {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Issue getting the user sub from the event"
        );
    }

    const userKey = createUserKey(userSub);
    const internalUserRightsKey = createInternalUserKey(userSub);
    const allInternalUsersKey = createAllInternalUsersKey();

    const [companyUserItems, internalUser] = await Promise.all([
        queryAllItemsFromPartitionInPrimaryTable<IUser>(userKey),
        getItemFromPrimaryTable<IInternalUser>(
            internalUserRightsKey,
            allInternalUsersKey
        ),
    ]);

    if (companyUserItems === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the company user items"
        );
    }

    if (companyUserItems.length === 0) {
        return createSuccessResponse({
            items: [],
        });
    }

    const companyInformationItems = companyUserItems.map((companyUserItem) => {
        const companyId = companyUserItem.belongsTo.split(".")[1];
        const boardColumnInformationKey = createCompanyInformationKey(
            companyId
        );
        const allCompanies = createAllCompaniesKey();
        const primaryTableModel: IDefaultPrimaryTableModel = {
            itemId: boardColumnInformationKey,
            belongsTo: allCompanies,
        };
        return primaryTableModel;
    });
    const companyInformationResults = await batchGetItemsInPrimaryTable<
        ICompanyInformation
    >(...companyInformationItems);

    if (companyInformationResults === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the company information"
        );
    }

    return createSuccessResponse({
        companyInformationItems: companyInformationResults,
        companyUserItems,
        internalUser,
    });
};
