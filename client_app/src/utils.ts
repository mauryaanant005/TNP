import { SERVER_URL } from "./constant";
export function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
export function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();
  console.log(obj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else if (value instanceof File) {
        formData.append(key, value, value.name);
      } else if (value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  }

  return formData;
}

export const convertImageToBase64 = async (imageUrl: string) => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // Base64 result
    reader.onerror = () => reject("Error converting image to Base64");
    reader.readAsDataURL(blob);
  });
};

export const Capitalize = (str: string) => {
  const str_array = str.split("_");
  if (str_array.length > 1) {
    return str_array
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const logout = async () => {
  const res = await fetch("/api/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken") || "",
    },
    credentials: "include",
  });
  if (res.ok) {
    window.open(`${SERVER_URL}/auth/login/`, "_self");
  }
};

export const redirectToProfile = async () => {
  window.open(`${SERVER_URL}/profile/`, "_self");
};
