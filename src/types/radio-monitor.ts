export interface RadioMonitorUploadParams {
  uploadUrl: string;
  contentType: string;
  fileUrl: string;
}

export interface RadioMonitorFile {
  fileName: string;
  uploadedAt: string;
}

export type RadioMonitorUploadSignatureResult =
  | { success: true; upload: RadioMonitorUploadParams }
  | { success: false; message: string };

export type RadioMonitorFileResult =
  | { success: true; file: RadioMonitorFile | null }
  | { success: false; message: string };
