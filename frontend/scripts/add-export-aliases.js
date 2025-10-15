#!/usr/bin/env node
/**
 * Post-generation script to add export aliases to the generated API index file.
 * This ensures backward compatibility with simplified import names.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../src/lib/api/generated/index.ts');

const ALIASES = `
// Aliases for simplified imports (for backward compatibility)
export {
  useGenerateReviewApiV1ReviewGenerateReviewPost as useGenerateReview,
  useSaveReviewApiV1ReviewSavePost as useSaveReview,
  useGetReviewHistoryApiV1ReviewHistoryGet as useGetReviewHistory,
  useGetReviewApiV1ReviewReviewIdGet as useGetReview,
  useDeleteReviewApiV1ReviewReviewIdDelete as useDeleteReview,
  getGetReviewHistoryApiV1ReviewHistoryGetQueryKey as getGetReviewHistoryQueryKey,
  getGetReviewApiV1ReviewReviewIdGetQueryKey as getGetReviewQueryKey,
} from "./review/review";

export {
  useSearchPapersApiV1PapersSearchGet as useSearchPapers,
  useGetPaperApiV1PapersPaperIdGet as useGetPaper,
  useChatWithPaperApiV1PapersPaperIdChatPost as useChatWithPaper,
  useUploadPdfApiV1PapersUploadPost as useUploadPaper,
  getSearchPapersApiV1PapersSearchGetQueryKey as getSearchPapersQueryKey,
  getGetPaperApiV1PapersPaperIdGetQueryKey as getGetPaperQueryKey,
} from "./papers/papers";

export {
  useGetTaskStatusApiV1TasksTaskIdGet as useGetTaskStatus,
  useGetUserTasksApiV1TasksGet as useGetUserTasks,
  useCancelTaskApiV1TasksTaskIdCancelPost as useCancelTask,
  getGetTaskStatusApiV1TasksTaskIdGetQueryKey as getGetTaskStatusQueryKey,
  getGetUserTasksApiV1TasksGetQueryKey as getGetUserTasksQueryKey,
} from "./tasks/tasks";

export {
  useGenerateDocumentApiV1DocumentsGeneratePost as useGenerateDocument,
} from "./documents/documents";

export {
  useClearUserHistoryApiV1HistoryClearPost as useClearUserHistory,
} from "./history/history";

export {
  useClerkWebhookApiV1UsersWebhookClerkPost as useClerkWebhook,
  useGetCurrentUserInfoApiV1UsersMeGet as useGetCurrentUserInfo,
} from "./users/users";
`;

try {
  let content = '';
  
  // Check if index.ts exists
  if (fs.existsSync(INDEX_PATH)) {
    // Read the current index.ts content
    content = fs.readFileSync(INDEX_PATH, 'utf8');
    
    // Remove any existing aliases section
    content = content.replace(/\/\/ Aliases for simplified imports[\s\S]*$/m, '').trim();
  } else {
    // Create base exports if file doesn't exist
    content = `export * from "./models";
export * from "./default/default";
export * from "./documents/documents";
export * from "./history/history";
export * from "./papers/papers";
export * from "./review/review";
export * from "./tasks/tasks";
export * from "./users/users";`;
  }
  
  // Append the aliases
  content += '\n' + ALIASES;
  
  // Write back to file
  fs.writeFileSync(INDEX_PATH, content);
  
  console.log('✅ Export aliases added successfully to generated/index.ts');
} catch (error) {
  console.error('❌ Error adding export aliases:', error.message);
  process.exit(1);
}

