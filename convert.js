import bs58 from "bs58";


const privateKey = [
    // 178, 163,......
]

const converted = bs58.encode(privateKey)
console.log("bs58 private key: " + converted);


