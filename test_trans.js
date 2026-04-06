import { roughTranslateToPseudocode } from './src/core/Translator.js';

const code = `arr = [3, 1, 2];
for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
        if (arr[j] > arr[j+1]) {
            let temp = arr[j];
            arr[j] = arr[j+1];
            arr[j+1] = temp;
        }
    }
}`;

console.log(roughTranslateToPseudocode(code, 'cpp'));
