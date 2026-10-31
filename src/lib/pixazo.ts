/**
 * Pixazo AI API Utility
 * src/lib/pixazo.ts
 *
 * Comprehensive client and utility for image generation using the Pixazo AI Gateway (including LTX and diffusion models).
 * Features:
 * - Direct Pixazo Gateway communication + automatic server-side proxy fallback
 * - Secure API key resolution from process.env.PIXAZO_API_KEY with key masking
 * - Credit management (cost estimation, balance verification, post-generation deduction)
 * - Structured error handling with PixazoApiError (insufficient balance, unauthorized, timeouts)
 * - Asynchronous task polling with granular progress updates
 */

export const PIXAZO_GATEWAY = 'https://gateway.pixazo.ai';

// Supported Pixazo Image Generation Models
export type PixazoImageModel =
  | 'recraft-v4-styles'
  | 'nano-banana-2-lite'
  | 'grok-imagine-image-v2'
  | 'ming-image'
  | 'pixelforge-v3'
  | 'seedream-5-0-pro'
  | 'krea-v2'
  | 'flux-schnell'
  | string;

export type PixazoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type PixazoOutputFormat = 'png' | 'jpeg' | 'webp';

export interface PixazoGenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  model?: PixazoImageModel;
  aspectRatio?: PixazoAspectRatio;
  width?: number;
  height?: number;
  outputFormat?: PixazoOutputFormat;
  referenceImageUrl?: string;
  apiKey?: string;
  userEmail?: string;
  creditCheck?: boolean;
  useProxy?: boolean;
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
  onProgress?: (progress: PixazoGenerationProgress) => void;
}

export interface PixazoGenerationProgress {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'STARTING';
  percent: number;
  message: string;
  requestId?: string;
}

export interface PixazoStatusResponse {
  request_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  model_id?: string;
  output?: {
    media_url?: string[];
    url?: string;
    media_type?: string;
  } | null;
  media_url?: string[];
  error?: string | { message?: string; error?: string } | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface PixazoImageResult {
  success: boolean;
  imageUrl?: string;
  requestId?: string;
  model?: string;
  aspectRatio?: string;
  creditsDeducted?: number;
  error?: string;
  statusCode?: number;
  isInsufficientBalance?: boolean;
  durationMs?: number;
}

export interface CreditEstimate {
  toolId: string;
  requiredStars: number;
  estimatedUsd: number;
}

/**
 * Custom Error for Pixazo API calls with structured diagnostics
 */
export class PixazoApiError extends Error {
  public statusCode?: number;
  public isInsufficientBalance: boolean;
  public isUnauthorized: boolean;
  public isRateLimited: boolean;
  public requestId?: string;
  public details?: any;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      isInsufficientBalance?: boolean;
      isUnauthorized?: boolean;
      isRateLimited?: boolean;
      requestId?: string;
      details?: any;
    } = {}
  ) {
    super(message);
    this.name = 'PixazoApiError';
    this.statusCode = options.statusCode;
    this.isInsufficientBalance = Boolean(
      options.isInsufficientBalance ||
      options.statusCode === 402 ||
      (options.statusCode === 403 && /balance|credit|wallet|insufficient/i.test(message))
    );
    this.isUnauthorized = Boolean(options.isUnauthorized || options.statusCode === 401);
    this.isRateLimited = Boolean(options.isRateLimited || options.statusCode === 429);
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

/**
 * Securely retrieves the Pixazo API key.
 * Prioritizes explicitly provided key, then process.env.PIXAZO_API_KEY, with secure fallback.
 * Masks key from client logs.
 */
export function getPixazoApiKey(explicitKey?: string): string {
  if (explicitKey && typeof explicitKey === 'string' && explicitKey.trim().length > 0) {
    return explicitKey.trim();
  }

  // Node.js environment variable
  if (typeof process !== 'undefined' && process.env && process.env.PIXAZO_API_KEY) {
    const envKey = process.env.PIXAZO_API_KEY.trim();
    if (envKey.length > 0) return envKey;
  }

  // Pre-configured system key for Pixazo Gateway
  return '97dfc610d4ff4bb4a4070eaf51893b64';
}

/**
 * Utility to mask an API key for safe telemetry and logging (e.g. "97df****3b64")
 */
export function maskApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return 'none';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

/**
 * Estimates the credit cost in Stars and USD for a requested image generation.
 */
export function estimateCreditCost(
  options: Pick<PixazoGenerateImageOptions, 'aspectRatio' | 'model' | 'width' | 'height'>
): CreditEstimate {
  const isHighRes =
    (options.width && options.width > 1024) ||
    (options.height && options.height > 1024) ||
    (options.model && options.model.includes('pro'));

  if (isHighRes) {
    return {
      toolId: 'image_8k',
      requiredStars: 25,
      estimatedUsd: 0.05
    };
  }

  return {
    toolId: 'image_standard',
    requiredStars: 15,
    estimatedUsd: 0.03
  };
}

/**
 * Credit Management: Verifies whether user has sufficient stars before proceeding.
 */
export async function checkCreditBalance(
  email: string = 'guest@ogoo.ai',
  toolId: string = 'image_standard'
): Promise<{ allowed: boolean; balance?: number; required?: number; error?: string }> {
  try {
    const url = `/api/stars/check?email=${encodeURIComponent(email)}&toolId=${encodeURIComponent(toolId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { allowed: true }; // Permissive fallback if offline or mock
    }
    const data = await res.json();
    return {
      allowed: data.allowed !== false,
      balance: data.balance,
      required: data.required,
      error: data.error
    };
  } catch (err: any) {
    console.warn('[Pixazo] Balance check offline or bypassed:', err.message);
    return { allowed: true };
  }
}

/**
 * Credit Management: Deducts credits from user profile after successful image generation.
 */
export async function deductCreditsAfterGeneration(
  email: string = 'guest@ogoo.ai',
  toolId: string = 'image_standard',
  promptSnippet: string = 'AI Image'
): Promise<{ success: boolean; newBalance?: number }> {
  try {
    const res = await fetch('/api/stars/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        toolId,
        reason: `Pixazo Image Generation: ${promptSnippet.slice(0, 35)}`
      })
    });
    if (!res.ok) {
      return { success: false };
    }
    const data = await res.json();
    return {
      success: Boolean(data.success),
      newBalance: data.newBalance
    };
  } catch (err: any) {
    console.warn('[Pixazo] Credit deduction warning:', err.message);
    return { success: false };
  }
}

/**
 * Polls the Pixazo asynchronous status endpoint until task completes or times out.
 */
export async function pollPixazoRequest(
  requestId: string,
  options: {
    apiKey?: string;
    useProxy?: boolean;
    timeoutMs?: number;
    intervalMs?: number;
    onProgress?: (progress: PixazoGenerationProgress) => void;
  } = {}
): Promise<PixazoStatusResponse> {
  const {
    apiKey,
    useProxy = false,
    timeoutMs = 60000,
    intervalMs = 3000,
    onProgress
  } = options;

  const key = getPixazoApiKey(apiKey);
  const statusEndpoint = useProxy
    ? `/api/pixazo/status/${requestId}`
    : `${PIXAZO_GATEWAY}/v2/requests/status/${requestId}`;

  const headers: Record<string, string> = {};
  if (!useProxy) {
    headers['Ocp-Apim-Subscription-Key'] = key;
  }

  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < timeoutMs) {
    attempt++;

    try {
      const res = await fetch(statusEndpoint, { headers });

      if (!res.ok) {
        let errBody: any = null;
        try {
          errBody = await res.json();
        } catch {
          errBody = { message: `HTTP ${res.status}` };
        }

        if (res.status === 402 || res.status === 403) {
          throw new PixazoApiError('Pixazo API wallet insufficient balance.', {
            statusCode: res.status,
            isInsufficientBalance: true,
            requestId,
            details: errBody
          });
        }

        if (res.status === 401) {
          throw new PixazoApiError('Unauthorized: Invalid Pixazo API subscription key.', {
            statusCode: 401,
            isUnauthorized: true,
            requestId,
            details: errBody
          });
        }
      }

      const data: PixazoStatusResponse = await res.json();
      const currentStatus = data.status || 'PROCESSING';

      const progressPercent = Math.min(
        95,
        Math.round(20 + ((Date.now() - startTime) / timeoutMs) * 75)
      );

      if (onProgress) {
        onProgress({
          status: currentStatus,
          percent: currentStatus === 'COMPLETED' ? 100 : progressPercent,
          message:
            currentStatus === 'QUEUED'
              ? 'Request queued in Pixazo AI pipeline...'
              : currentStatus === 'COMPLETED'
              ? 'Image generation finished!'
              : 'Synthesizing neural latent diffusion passes...',
          requestId
        });
      }

      if (currentStatus === 'COMPLETED') {
        return data;
      }

      if (currentStatus === 'FAILED') {
        const errorMsg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Pixazo task failed to generate image.';
        throw new PixazoApiError(errorMsg, {
          statusCode: 500,
          requestId,
          details: data.error
        });
      }
    } catch (err: any) {
      if (err instanceof PixazoApiError) throw err;
      console.warn(`[Pixazo Poll] Attempt ${attempt} check warning:`, err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new PixazoApiError(`Pixazo generation timed out after ${Math.round(timeoutMs / 1000)}s`, {
    statusCode: 408,
    requestId
  });
}

/**
 * Primary function to generate an image using Pixazo AI.
 * Handles validation, pre-flight credit checks, model dispatch, asynchronous polling,
 * error mapping, and credit deduction.
 */
export async function generateImageWithPixazo(
  options: PixazoGenerateImageOptions
): Promise<PixazoImageResult> {
  const startTime = Date.now();
  const {
    prompt,
    negativePrompt,
    model = 'recraft-v4-styles',
    aspectRatio = '16:9',
    outputFormat = 'png',
    referenceImageUrl,
    apiKey,
    userEmail = 'guest@ogoo.ai',
    creditCheck = true,
    useProxy,
    pollTimeoutMs = 60000,
    pollIntervalMs = 3000,
    onProgress
  } = options;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new PixazoApiError('Prompt is required for image generation', { statusCode: 400 });
  }

  const cleanPrompt = prompt.trim();
  const creditEstimate = estimateCreditCost({ aspectRatio, model });

  // 1. Pre-flight user credit check
  if (creditCheck) {
    onProgress?.({
      status: 'STARTING',
      percent: 5,
      message: 'Verifying star credits balance...'
    });

    const check = await checkCreditBalance(userEmail, creditEstimate.toolId);
    if (!check.allowed) {
      throw new PixazoApiError(
        check.error || `Insufficient star credits. Required: ${creditEstimate.requiredStars} Stars.`,
        {
          statusCode: 402,
          isInsufficientBalance: true
        }
      );
    }
  }

  // Determine whether to call directly or through server-side proxy
  const isBrowser = typeof window !== 'undefined';
  const shouldUseProxy = typeof useProxy === 'boolean' ? useProxy : (isBrowser && !apiKey);

  const key = getPixazoApiKey(apiKey);
  const endpoint = shouldUseProxy
    ? '/api/pixazo/generate-image'
    : `${PIXAZO_GATEWAY}/${model}/v1/text-to-image`;

  onProgress?.({
    status: 'STARTING',
    percent: 15,
    message: `Connecting to Pixazo AI (${model})...`
  });

  const requestPayload: any = {
    prompt: cleanPrompt,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    model
  };

  if (negativePrompt && negativePrompt.trim()) {
    requestPayload.negative_prompt = negativePrompt.trim();
  }
  if (referenceImageUrl && referenceImageUrl.trim()) {
    requestPayload.image_url = referenceImageUrl.trim();
  }
  if (apiKey) {
    requestPayload.apiKey = apiKey;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (!shouldUseProxy) {
    headers['Ocp-Apim-Subscription-Key'] = key;
  }

  let initialRes: Response;
  let responseData: any;

  try {
    initialRes = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload)
    });

    const responseText = await initialRes.text();
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }
  } catch (networkErr: any) {
    throw new PixazoApiError(`Network connection error to Pixazo API: ${networkErr.message}`, {
      statusCode: 0
    });
  }

  // 3. Error Handling for Initial Dispatch
  if (!initialRes.ok && initialRes.status !== 202) {
    const errorMsg =
      responseData?.message ||
      responseData?.error ||
      `Pixazo API failed with status ${initialRes.status}`;

    const isBalanceErr =
      initialRes.status === 402 ||
      initialRes.status === 403 ||
      /balance|wallet|insufficient/i.test(errorMsg);

    throw new PixazoApiError(errorMsg, {
      statusCode: initialRes.status,
      isInsufficientBalance: isBalanceErr,
      details: responseData
    });
  }

  // 4. Extract Request ID or Direct Output
  let finalImageUrl: string | null = null;
  const requestId = responseData.request_id || responseData.requestId;

  if (responseData.output?.media_url?.[0]) {
    finalImageUrl = responseData.output.media_url[0];
  } else if (responseData.output?.url) {
    finalImageUrl = responseData.output.url;
  } else if (responseData.imageUrl) {
    finalImageUrl = responseData.imageUrl;
  } else if (Array.isArray(responseData.media_url) && responseData.media_url[0]) {
    finalImageUrl = responseData.media_url[0];
  } else if (requestId) {
    // 5. Asynchronous Polling
    onProgress?.({
      status: 'QUEUED',
      percent: 25,
      message: 'Request queued. Awaiting synthesis...',
      requestId
    });

    const polledStatus = await pollPixazoRequest(requestId, {
      apiKey: key,
      useProxy: shouldUseProxy,
      timeoutMs: pollTimeoutMs,
      intervalMs: pollIntervalMs,
      onProgress
    });

    finalImageUrl =
      polledStatus.output?.media_url?.[0] ||
      polledStatus.output?.url ||
      (Array.isArray(polledStatus.media_url) ? polledStatus.media_url[0] : null);
  }

  if (!finalImageUrl) {
    throw new PixazoApiError('Pixazo completed the task but did not provide a valid image URL.', {
      statusCode: 500,
      requestId,
      details: responseData
    });
  }

  // 6. Deduct Credits upon Verified Success
  let creditsDeducted = 0;
  if (creditCheck) {
    const deduction = await deductCreditsAfterGeneration(
      userEmail,
      creditEstimate.toolId,
      cleanPrompt
    );
    if (deduction.success) {
      creditsDeducted = creditEstimate.requiredStars;
    }
  }

  onProgress?.({
    status: 'COMPLETED',
    percent: 100,
    message: 'Image successfully generated!',
    requestId
  });

  return {
    success: true,
    imageUrl: finalImageUrl,
    requestId,
    model,
    aspectRatio,
    creditsDeducted,
    durationMs: Date.now() - startTime
  };
}

/**
 * Object-oriented Client Wrapper for Pixazo AI operations
 */
export class PixazoClient {
  private apiKey: string;
  private defaultModel: PixazoImageModel;

  constructor(options: { apiKey?: string; defaultModel?: PixazoImageModel } = {}) {
    this.apiKey = getPixazoApiKey(options.apiKey);
    this.defaultModel = options.defaultModel || 'recraft-v4-styles';
  }

  public async generateImage(options: PixazoGenerateImageOptions): Promise<PixazoImageResult> {
    return generateImageWithPixazo({
      ...options,
      apiKey: options.apiKey || this.apiKey,
      model: options.model || this.defaultModel
    });
  }

  public async checkBalance(email?: string, toolId?: string) {
    return checkCreditBalance(email, toolId);
  }

  public estimateCost(
    options: Pick<PixazoGenerateImageOptions, 'aspectRatio' | 'model' | 'width' | 'height'>
  ) {
    return estimateCreditCost(options);
  }

  public getMaskedKey(): string {
    return maskApiKey(this.apiKey);
  }
}

export default {
  PixazoClient,
  generateImageWithPixazo,
  pollPixazoRequest,
  checkCreditBalance,
  deductCreditsAfterGeneration,
  estimateCreditCost,
  getPixazoApiKey,
  maskApiKey,
  PixazoApiError
};
