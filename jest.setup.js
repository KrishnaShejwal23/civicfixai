require("@testing-library/jest-dom");
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Uint8Array = Uint8Array;
