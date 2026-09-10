import {
  generateKeyPairSync,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
const passwordBytes = randomBytes(24);
const password = Array.from(passwordBytes, (byte) => alphabet[byte % alphabet.length]).join("");
const salt = randomBytes(16);
const iterations = 210_000;
const passwordHash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = privateKey.export({ format: "jwk" });
const publicKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, "base64url"),
  Buffer.from(jwk.y, "base64url"),
]);

console.log("Store the generated password in a password manager. It is shown only now.\n");
console.log(`ADMIN_USERNAME=nilima`);
console.log(`ADMIN_GENERATED_PASSWORD=${password}`);
console.log(
  `ADMIN_PASSWORD_HASH=pbkdf2_sha256$${iterations}$${base64url(salt)}$${base64url(passwordHash)}`,
);
console.log(`ADMIN_SESSION_SECRET=${base64url(randomBytes(48))}`);
console.log(`ADMIN_RATE_LIMIT_SECRET=${base64url(randomBytes(48))}`);
console.log(`VAPID_PUBLIC_KEY=${base64url(publicKey)}`);
console.log(`VAPID_PRIVATE_KEY=${jwk.d}`);
console.log("VAPID_SUBJECT=mailto:replace-with-owner-email@example.com");
