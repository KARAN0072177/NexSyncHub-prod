export async function apiFetch(

  input: RequestInfo,

  init?: RequestInit

) {

  const res =
    await fetch(
      input,
      init
    );

  const data =
    await res.json();

  // 🔥 Global ban handling
  if (
    data.code ===
    "ACCOUNT_BANNED"
  ) {

    window.dispatchEvent(

      new CustomEvent(

        "account-banned",

        {
          detail: data,
        }

      )

    );

  }

  return {

    res,
    data,

  };

}