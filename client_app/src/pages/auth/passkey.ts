import { api } from "@/lib/api";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";

// Convert base64 / base64url string to Uint8Array
function bufferDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert ArrayBuffer to base64url string
function bufferEncode(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export const isPasskeySupported = (): boolean => {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === "function"
  );
};

export const registerPasskey = async (passkeyName = "My Device"): Promise<boolean> => {
  if (!isPasskeySupported()) {
    toast.error("Passkeys (WebAuthn) are not supported on this browser/device.");
    return false;
  }

  try {
    const beginRes = await api.post("/auth/api/passkey/register/begin/", {}, {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
    });

    const options = beginRes.data;
    options.challenge = bufferDecode(options.challenge);
    options.user.id = bufferDecode(options.user.id);

    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map((cred: { id: string; type: string }) => ({
        ...cred,
        id: bufferDecode(cred.id),
      }));
    }

    const credential = (await navigator.credentials.create({
      publicKey: options,
    })) as PublicKeyCredential;

    if (!credential) {
      toast.error("Passkey registration cancelled.");
      return false;
    }

    const rawId = bufferEncode(credential.rawId);
    const responseData = credential.response as AuthenticatorAttestationResponse;

    const credentialJSON = {
      id: credential.id,
      rawId: rawId,
      type: credential.type,
      response: {
        attestationObject: bufferEncode(responseData.attestationObject),
        clientDataJSON: bufferEncode(responseData.clientDataJSON),
      },
    };

    await api.post(
      "/auth/api/passkey/register/finish/",
      { credential: credentialJSON, name: passkeyName },
      {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
      }
    );

    toast.success("Passkey registered successfully!");
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to register Passkey";
    toast.error(msg);
    return false;
  }
};

export const loginWithPasskey = async (email?: string): Promise<boolean> => {
  if (!isPasskeySupported()) {
    toast.error("Passkeys (WebAuthn) are not supported on this browser/device.");
    return false;
  }

  try {
    const beginRes = await api.post("/auth/api/passkey/login/begin/", { email }, {
      withCredentials: true,
    });

    const options = beginRes.data;
    options.challenge = bufferDecode(options.challenge);

    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map((cred: { id: string; type: string }) => ({
        ...cred,
        id: bufferDecode(cred.id),
      }));
    }

    const assertion = (await navigator.credentials.get({
      publicKey: options,
    })) as PublicKeyCredential;

    if (!assertion) {
      toast.error("Passkey sign-in cancelled.");
      return false;
    }

    const rawId = bufferEncode(assertion.rawId);
    const responseData = assertion.response as AuthenticatorAssertionResponse;

    const assertionJSON = {
      id: assertion.id,
      rawId: rawId,
      type: assertion.type,
      response: {
        authenticatorData: bufferEncode(responseData.authenticatorData),
        clientDataJSON: bufferEncode(responseData.clientDataJSON),
        signature: bufferEncode(responseData.signature),
        userHandle: responseData.userHandle ? bufferEncode(responseData.userHandle) : null,
      },
    };

    const finishRes = await api.post("/auth/api/passkey/login/finish/", { credential: assertionJSON }, {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
    });

    toast.success(`Welcome back, ${finishRes.data.full_name || finishRes.data.email}!`);
    window.location.href = "/";
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Passkey authentication failed";
    toast.error(msg);
    return false;
  }
};
