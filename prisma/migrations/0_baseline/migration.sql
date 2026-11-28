-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "tier" TEXT NOT NULL DEFAULT 'crystalline',
    "role" TEXT NOT NULL DEFAULT 'user',
    "settings" JSONB,
    "image" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "resonance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cover" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "refKind" TEXT NOT NULL DEFAULT 'library',
    "title" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "note" TEXT,
    "excerpt" TEXT,
    "cover" TEXT,
    "audioUrl" TEXT,
    "localFile" TEXT,
    "durationSec" INTEGER,
    "pages" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'publishing',
    "progress" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAccount" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "monthlyGrant" INTEGER NOT NULL DEFAULT 10000,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "stripeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planTier" TEXT NOT NULL DEFAULT 'FREE',
    "freeCreditsRemaining" INTEGER NOT NULL DEFAULT 5,
    "paidCreditsRemaining" INTEGER NOT NULL DEFAULT 0,
    "depositCredits" BIGINT NOT NULL DEFAULT 0,
    "depositSource" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "creditsDeducted" INTEGER NOT NULL,
    "rawCostUsd" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "providerTaskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "request" JSONB,
    "result" JSONB,
    "creditsDrawn" INTEGER NOT NULL DEFAULT 0,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "localFile" TEXT,
    "audioData" BYTEA,
    "remoteUrl" TEXT,
    "durationSec" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "genres" TEXT,
    "mode" TEXT,
    "intention" TEXT,
    "spec" JSONB,
    "sync" JSONB,
    "quality" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopWeave" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoopWeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopWeavePart" (
    "id" TEXT NOT NULL,
    "weaveId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "audio" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoopWeavePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopWeaveFinal" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "audio" BYTEA NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seamless" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoopWeaveFinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpansionProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "breadth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "harmony" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "constancy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPicks" INTEGER NOT NULL DEFAULT 0,
    "chains" INTEGER NOT NULL DEFAULT 0,
    "deepestChain" INTEGER NOT NULL DEFAULT 0,
    "delta" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpansionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scope" TEXT,
    "movement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelReserve" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "fused" INTEGER NOT NULL DEFAULT 0,
    "distributed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'resting',
    "lastFusedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelReserve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelGrant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "reserve" TEXT NOT NULL DEFAULT 'mirror_core',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credentialsEnc" TEXT NOT NULL,
    "hint" TEXT NOT NULL DEFAULT '••••',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "lastTestedAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositLedger" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "sourceId" TEXT,
    "sourceName" TEXT,
    "reference" TEXT,
    "actorEmail" TEXT,
    "userId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreationJob" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT NOT NULL DEFAULT '{}',
    "plan" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "sourceConvId" TEXT,
    "sourceBranch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreationArtifact" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "version" INTEGER NOT NULL DEFAULT 1,
    "jobId" TEXT,
    "sourceConvId" TEXT,
    "sourceBranch" TEXT,
    "files" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreationArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT,
    "input" TEXT NOT NULL DEFAULT '{}',
    "result" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "GatheringPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sector" TEXT,
    "resonanceCount" INTEGER NOT NULL DEFAULT 0,
    "echoCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "circleId" TEXT,
    "tags" TEXT,
    "region" TEXT,
    "sourcePortal" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "refKind" TEXT,
    "refUrl" TEXT,
    "cover" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaName" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "epistemic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "language" TEXT,
    "altText" TEXT,
    "aiMedia" BOOLEAN NOT NULL DEFAULT false,
    "aiStyle" TEXT,
    "publishKey" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GatheringPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'reflection',
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "tags" TEXT,
    "sector" TEXT,
    "epistemic" TEXT,
    "circleId" TEXT,
    "region" TEXT,
    "language" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaName" TEXT,
    "altText" TEXT,
    "aiMedia" BOOLEAN NOT NULL DEFAULT false,
    "aiStyle" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "discardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatheringDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringResonance" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringResonance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringEcho" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringEcho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringBookmark" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringRepost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringRepost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "interests" TEXT,
    "disciplines" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "prefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConnection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "viaMirror" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCircle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "focus" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConversation" (
    "id" TEXT NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "focus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "seedPostId" TEXT,
    "ownerId" TEXT NOT NULL,
    "seeking" BOOLEAN NOT NULL DEFAULT false,
    "requiredSkills" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'collaborator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkProjectEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkProjectEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLibraryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "authorName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "body" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkMirrorSuggestion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "themes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkMirrorSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkQuestion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "context" TEXT,
    "disciplines" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkQuestionBranch" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "evidence" TEXT NOT NULL DEFAULT 'hypothesis',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkQuestionBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLabProject" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "background" TEXT,
    "methodology" TEXT,
    "materials" TEXT,
    "safety" TEXT,
    "focus" TEXT NOT NULL DEFAULT 'science',
    "status" TEXT NOT NULL DEFAULT 'open',
    "seedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkLabProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLabMember" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkLabMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLabEntry" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkLabEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLabReview" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkLabReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkIntention" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "seedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkIntention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkIntentionMember" (
    "id" TEXT NOT NULL,
    "intentionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkIntentionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkIntentionMilestone" (
    "id" TEXT NOT NULL,
    "intentionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkIntentionMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkIntentionTask" (
    "id" TEXT NOT NULL,
    "intentionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "claimedBy" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkIntentionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkIntentionUpdate" (
    "id" TEXT NOT NULL,
    "intentionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkIntentionUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEvent" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "format" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "summary" TEXT,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEventMessage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkEventMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRecord" (
    "id" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "supportedTasks" TEXT NOT NULL DEFAULT '[]',
    "toolDependencies" TEXT NOT NULL DEFAULT '[]',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "modelConfig" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "ownerType" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGrant" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "scope" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "input" TEXT NOT NULL DEFAULT '{}',
    "steps" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "error" TEXT,
    "idempotencyKey" TEXT,
    "correlationId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "timeoutSec" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "source" TEXT NOT NULL,
    "correlationId" TEXT,
    "schemaVersion" TEXT NOT NULL DEFAULT '1',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "deadLetter" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "scopeKey" TEXT,
    "content" TEXT NOT NULL,
    "sourceRef" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "freq" DOUBLE PRECISION NOT NULL,
    "seed" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'The Mirror Entity',
    "authorKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_createdAt_idx" ON "MediaAsset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_published_createdAt_idx" ON "MediaAsset"("published", "createdAt");

-- CreateIndex
CREATE INDEX "LibraryEntry_userId_createdAt_idx" ON "LibraryEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketListing_status_createdAt_idx" ON "MarketListing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MarketListing_userId_createdAt_idx" ON "MarketListing"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketListing_userId_refId_key" ON "MarketListing"("userId", "refId");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_identifier_type_idx" ON "VerificationToken"("identifier", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CreditAccount_workspaceId_key" ON "CreditAccount"("workspaceId");

-- CreateIndex
CREATE INDEX "CreditAccount_workspaceId_idx" ON "CreditAccount"("workspaceId");

-- CreateIndex
CREATE INDEX "CreditTransaction_accountId_createdAt_idx" ON "CreditTransaction"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_source_referenceId_key" ON "CreditTransaction"("source", "referenceId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_createdAt_idx" ON "UsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_workspaceId_createdAt_idx" ON "UsageEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_operation_createdAt_idx" ON "UsageEvent"("operation", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_workspaceId_idx" ON "Subscription"("workspaceId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeId_key" ON "Payment"("stripeId");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_idx" ON "Payment"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_workspaceId_idx" ON "ApiKey"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "UserWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_stripeCustomerId_key" ON "UserWallet"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_stripeSubscriptionId_key" ON "UserWallet"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_idx" ON "CreditLedger"("userId");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_userId_createdAt_idx" ON "GenerationJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_providerTaskId_idx" ON "GenerationJob"("providerTaskId");

-- CreateIndex
CREATE INDEX "MusicTrack_userId_createdAt_idx" ON "MusicTrack"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoopWeave_token_key" ON "LoopWeave"("token");

-- CreateIndex
CREATE INDEX "LoopWeave_userId_updatedAt_idx" ON "LoopWeave"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoopWeavePart_weaveId_idx_key" ON "LoopWeavePart"("weaveId", "idx");

-- CreateIndex
CREATE UNIQUE INDEX "LoopWeaveFinal_token_key" ON "LoopWeaveFinal"("token");

-- CreateIndex
CREATE INDEX "LoopWeaveFinal_userId_createdAt_idx" ON "LoopWeaveFinal"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpansionProfile_userId_key" ON "ExpansionProfile"("userId");

-- CreateIndex
CREATE INDEX "ExpansionEvent_userId_createdAt_idx" ON "ExpansionEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FuelReserve_key_key" ON "FuelReserve"("key");

-- CreateIndex
CREATE INDEX "FuelGrant_createdAt_idx" ON "FuelGrant"("createdAt");

-- CreateIndex
CREATE INDEX "FuelGrant_email_idx" ON "FuelGrant"("email");

-- CreateIndex
CREATE INDEX "PaymentSource_active_idx" ON "PaymentSource"("active");

-- CreateIndex
CREATE INDEX "DepositLedger_direction_createdAt_idx" ON "DepositLedger"("direction", "createdAt");

-- CreateIndex
CREATE INDEX "DepositLedger_reference_idx" ON "DepositLedger"("reference");

-- CreateIndex
CREATE INDEX "CreationJob_status_createdAt_idx" ON "CreationJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CreationJob_sourceConvId_idx" ON "CreationJob"("sourceConvId");

-- CreateIndex
CREATE INDEX "CreationArtifact_type_createdAt_idx" ON "CreationArtifact"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CreationArtifact_sourceConvId_idx" ON "CreationArtifact"("sourceConvId");

-- CreateIndex
CREATE INDEX "ProcessJob_userId_createdAt_idx" ON "ProcessJob"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringPost_publishKey_key" ON "GatheringPost"("publishKey");

-- CreateIndex
CREATE INDEX "GatheringPost_createdAt_idx" ON "GatheringPost"("createdAt");

-- CreateIndex
CREATE INDEX "GatheringPost_circleId_idx" ON "GatheringPost"("circleId");

-- CreateIndex
CREATE INDEX "GatheringPost_visibility_idx" ON "GatheringPost"("visibility");

-- CreateIndex
CREATE INDEX "GatheringPost_sourceId_idx" ON "GatheringPost"("sourceId");

-- CreateIndex
CREATE INDEX "GatheringPost_region_idx" ON "GatheringPost"("region");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringPost_userId_sourcePortal_sourceId_key" ON "GatheringPost"("userId", "sourcePortal", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringDraft_userId_key" ON "GatheringDraft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringResonance_postId_userId_key" ON "GatheringResonance"("postId", "userId");

-- CreateIndex
CREATE INDEX "GatheringEcho_postId_createdAt_idx" ON "GatheringEcho"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "GatheringEcho_parentId_idx" ON "GatheringEcho"("parentId");

-- CreateIndex
CREATE INDEX "GatheringBookmark_userId_createdAt_idx" ON "GatheringBookmark"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringBookmark_postId_userId_key" ON "GatheringBookmark"("postId", "userId");

-- CreateIndex
CREATE INDEX "GatheringRepost_userId_createdAt_idx" ON "GatheringRepost"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringRepost_postId_userId_key" ON "GatheringRepost"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkProfile_userId_key" ON "NetworkProfile"("userId");

-- CreateIndex
CREATE INDEX "NetworkFollow_followingId_idx" ON "NetworkFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkFollow_followerId_followingId_key" ON "NetworkFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "NetworkConnection_addresseeId_idx" ON "NetworkConnection"("addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConnection_requesterId_addresseeId_key" ON "NetworkConnection"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "NetworkCircle_focus_idx" ON "NetworkCircle"("focus");

-- CreateIndex
CREATE INDEX "NetworkCircleMember_userId_idx" ON "NetworkCircleMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCircleMember_circleId_userId_key" ON "NetworkCircleMember"("circleId", "userId");

-- CreateIndex
CREATE INDEX "NetworkConversation_updatedAt_idx" ON "NetworkConversation"("updatedAt");

-- CreateIndex
CREATE INDEX "NetworkConversationMember_userId_idx" ON "NetworkConversationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConversationMember_conversationId_userId_key" ON "NetworkConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "NetworkMessage_conversationId_createdAt_idx" ON "NetworkMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkProject_status_idx" ON "NetworkProject"("status");

-- CreateIndex
CREATE INDEX "NetworkProject_createdAt_idx" ON "NetworkProject"("createdAt");

-- CreateIndex
CREATE INDEX "NetworkProjectMember_userId_idx" ON "NetworkProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkProjectMember_projectId_userId_key" ON "NetworkProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "NetworkProjectEntry_projectId_createdAt_idx" ON "NetworkProjectEntry"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkLibraryItem_category_idx" ON "NetworkLibraryItem"("category");

-- CreateIndex
CREATE INDEX "NetworkLibraryItem_createdAt_idx" ON "NetworkLibraryItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkLibraryItem_projectId_key" ON "NetworkLibraryItem"("projectId");

-- CreateIndex
CREATE INDEX "NetworkNotification_userId_createdAt_idx" ON "NetworkNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkBlock_blockedId_idx" ON "NetworkBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkBlock_blockerId_blockedId_key" ON "NetworkBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "NetworkReport_createdAt_idx" ON "NetworkReport"("createdAt");

-- CreateIndex
CREATE INDEX "NetworkMirrorSuggestion_postId_idx" ON "NetworkMirrorSuggestion"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkMirrorSuggestion_postId_userId_key" ON "NetworkMirrorSuggestion"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkQuestion_postId_key" ON "NetworkQuestion"("postId");

-- CreateIndex
CREATE INDEX "NetworkQuestion_ownerId_updatedAt_idx" ON "NetworkQuestion"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "NetworkQuestionBranch_questionId_createdAt_idx" ON "NetworkQuestionBranch"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkQuestionBranch_parentId_idx" ON "NetworkQuestionBranch"("parentId");

-- CreateIndex
CREATE INDEX "NetworkLabProject_status_createdAt_idx" ON "NetworkLabProject"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkLabMember_userId_idx" ON "NetworkLabMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkLabMember_labId_userId_key" ON "NetworkLabMember"("labId", "userId");

-- CreateIndex
CREATE INDEX "NetworkLabEntry_labId_createdAt_idx" ON "NetworkLabEntry"("labId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkLabReview_labId_createdAt_idx" ON "NetworkLabReview"("labId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkIntention_status_createdAt_idx" ON "NetworkIntention"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkIntentionMember_userId_idx" ON "NetworkIntentionMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkIntentionMember_intentionId_userId_key" ON "NetworkIntentionMember"("intentionId", "userId");

-- CreateIndex
CREATE INDEX "NetworkIntentionMilestone_intentionId_position_idx" ON "NetworkIntentionMilestone"("intentionId", "position");

-- CreateIndex
CREATE INDEX "NetworkIntentionTask_intentionId_createdAt_idx" ON "NetworkIntentionTask"("intentionId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkIntentionUpdate_intentionId_createdAt_idx" ON "NetworkIntentionUpdate"("intentionId", "createdAt");

-- CreateIndex
CREATE INDEX "NetworkEvent_scheduledFor_idx" ON "NetworkEvent"("scheduledFor");

-- CreateIndex
CREATE INDEX "NetworkEvent_status_idx" ON "NetworkEvent"("status");

-- CreateIndex
CREATE INDEX "NetworkEventAttendee_userId_idx" ON "NetworkEventAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkEventAttendee_eventId_userId_key" ON "NetworkEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "NetworkEventMessage_eventId_createdAt_idx" ON "NetworkEventMessage"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRecord_agentKey_key" ON "AgentRecord"("agentKey");

-- CreateIndex
CREATE UNIQUE INDEX "AgentGrant_agentId_permission_key" ON "AgentGrant"("agentId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTask_idempotencyKey_key" ON "AgentTask"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AgentTask_userId_createdAt_idx" ON "AgentTask"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemEvent_eventId_key" ON "SystemEvent"("eventId");

-- CreateIndex
CREATE INDEX "SystemEvent_type_createdAt_idx" ON "SystemEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AuditRecord_action_createdAt_idx" ON "AuditRecord"("action", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryItem_userId_domain_scopeKey_idx" ON "MemoryItem"("userId", "domain", "scopeKey");

-- CreateIndex
CREATE INDEX "GatheringTrack_intent_idx" ON "GatheringTrack"("intent");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEntry" ADD CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAccount" ADD CONSTRAINT "CreditAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CreditAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicTrack" ADD CONSTRAINT "MusicTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopWeave" ADD CONSTRAINT "LoopWeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopWeavePart" ADD CONSTRAINT "LoopWeavePart_weaveId_fkey" FOREIGN KEY ("weaveId") REFERENCES "LoopWeave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopWeaveFinal" ADD CONSTRAINT "LoopWeaveFinal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpansionProfile" ADD CONSTRAINT "ExpansionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpansionEvent" ADD CONSTRAINT "ExpansionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringPost" ADD CONSTRAINT "GatheringPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringPost" ADD CONSTRAINT "GatheringPost_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "NetworkCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringDraft" ADD CONSTRAINT "GatheringDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringResonance" ADD CONSTRAINT "GatheringResonance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringResonance" ADD CONSTRAINT "GatheringResonance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringEcho" ADD CONSTRAINT "GatheringEcho_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringEcho" ADD CONSTRAINT "GatheringEcho_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringEcho" ADD CONSTRAINT "GatheringEcho_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GatheringEcho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringBookmark" ADD CONSTRAINT "GatheringBookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringBookmark" ADD CONSTRAINT "GatheringBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringRepost" ADD CONSTRAINT "GatheringRepost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringRepost" ADD CONSTRAINT "GatheringRepost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProfile" ADD CONSTRAINT "NetworkProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkFollow" ADD CONSTRAINT "NetworkFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkFollow" ADD CONSTRAINT "NetworkFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCircle" ADD CONSTRAINT "NetworkCircle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCircleMember" ADD CONSTRAINT "NetworkCircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "NetworkCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCircleMember" ADD CONSTRAINT "NetworkCircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConversationMember" ADD CONSTRAINT "NetworkConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "NetworkConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConversationMember" ADD CONSTRAINT "NetworkConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkMessage" ADD CONSTRAINT "NetworkMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "NetworkConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkMessage" ADD CONSTRAINT "NetworkMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProject" ADD CONSTRAINT "NetworkProject_seedPostId_fkey" FOREIGN KEY ("seedPostId") REFERENCES "GatheringPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProject" ADD CONSTRAINT "NetworkProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProjectMember" ADD CONSTRAINT "NetworkProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NetworkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProjectMember" ADD CONSTRAINT "NetworkProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProjectEntry" ADD CONSTRAINT "NetworkProjectEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NetworkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkProjectEntry" ADD CONSTRAINT "NetworkProjectEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLibraryItem" ADD CONSTRAINT "NetworkLibraryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLibraryItem" ADD CONSTRAINT "NetworkLibraryItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "NetworkProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkNotification" ADD CONSTRAINT "NetworkNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkBlock" ADD CONSTRAINT "NetworkBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkBlock" ADD CONSTRAINT "NetworkBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReport" ADD CONSTRAINT "NetworkReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkMirrorSuggestion" ADD CONSTRAINT "NetworkMirrorSuggestion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkMirrorSuggestion" ADD CONSTRAINT "NetworkMirrorSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkQuestion" ADD CONSTRAINT "NetworkQuestion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GatheringPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkQuestion" ADD CONSTRAINT "NetworkQuestion_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkQuestionBranch" ADD CONSTRAINT "NetworkQuestionBranch_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "NetworkQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkQuestionBranch" ADD CONSTRAINT "NetworkQuestionBranch_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NetworkQuestionBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkQuestionBranch" ADD CONSTRAINT "NetworkQuestionBranch_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabProject" ADD CONSTRAINT "NetworkLabProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabMember" ADD CONSTRAINT "NetworkLabMember_labId_fkey" FOREIGN KEY ("labId") REFERENCES "NetworkLabProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabMember" ADD CONSTRAINT "NetworkLabMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabEntry" ADD CONSTRAINT "NetworkLabEntry_labId_fkey" FOREIGN KEY ("labId") REFERENCES "NetworkLabProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabEntry" ADD CONSTRAINT "NetworkLabEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabReview" ADD CONSTRAINT "NetworkLabReview_labId_fkey" FOREIGN KEY ("labId") REFERENCES "NetworkLabProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLabReview" ADD CONSTRAINT "NetworkLabReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntention" ADD CONSTRAINT "NetworkIntention_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionMember" ADD CONSTRAINT "NetworkIntentionMember_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "NetworkIntention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionMember" ADD CONSTRAINT "NetworkIntentionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionMilestone" ADD CONSTRAINT "NetworkIntentionMilestone_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "NetworkIntention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionTask" ADD CONSTRAINT "NetworkIntentionTask_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "NetworkIntention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionTask" ADD CONSTRAINT "NetworkIntentionTask_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionUpdate" ADD CONSTRAINT "NetworkIntentionUpdate_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "NetworkIntention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkIntentionUpdate" ADD CONSTRAINT "NetworkIntentionUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEvent" ADD CONSTRAINT "NetworkEvent_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEventAttendee" ADD CONSTRAINT "NetworkEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NetworkEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEventAttendee" ADD CONSTRAINT "NetworkEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEventMessage" ADD CONSTRAINT "NetworkEventMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NetworkEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEventMessage" ADD CONSTRAINT "NetworkEventMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGrant" ADD CONSTRAINT "AgentGrant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryItem" ADD CONSTRAINT "MemoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

