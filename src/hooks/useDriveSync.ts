// Declare the google global injected by the GIS script in index.html
declare const google: any;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

/**
 * Uploads a CSV Blob to Google Drive.
 * Returns the uploaded file's name on success.
 */
export async function uploadToDrive(
  csvBlob: Blob,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Build token client each time so we always get a fresh token
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }

        try {
          const accessToken = tokenResponse.access_token;

          // Search for existing file with the same name to overwrite it
          const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name%3D%22${encodeURIComponent(
              fileName
            )}%22+and+trashed%3Dfalse&fields=files(id%2Cname)`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const searchData = await searchRes.json();
          const existingFile = searchData.files?.[0];

          const metadata = {
            name: fileName,
            mimeType: "text/csv",
          };

          const form = new FormData();
          form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
          );
          form.append("file", csvBlob);

          let uploadUrl: string;
          let method: string;

          if (existingFile) {
            // PATCH to overwrite the existing file
            uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
            method = "PATCH";
          } else {
            // POST to create a new file
            uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
            method = "POST";
          }

          const uploadRes = await fetch(uploadUrl, {
            method,
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            reject(new Error(err.error?.message || "Drive upload failed"));
            return;
          }

          resolve(fileName);
        } catch (err: any) {
          reject(err);
        }
      },
    });

    // Request the token (shows consent screen if needed)
    tokenClient.requestAccessToken({ prompt: "" });
  });
}
