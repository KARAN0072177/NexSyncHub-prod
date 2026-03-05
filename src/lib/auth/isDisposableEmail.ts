const bannedDomains = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "trashmail.com",
  "yopmail.com",
];

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();

  return bannedDomains.includes(domain);
}