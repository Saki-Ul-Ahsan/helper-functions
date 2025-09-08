function convertToWords(n: number): string {
  if (n === 0) return "Zero";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(n: number): string {
    if (n === 0) return "";
    else if (n < 20) return units[n];
    else
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
  }

  function numberToWordsUpto9999(n: number): string {
    let result = "";
    if (n >= 1000) {
      result += units[Math.floor(n / 1000)] + " Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      result += units[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      result += twoDigits(n);
    }
    return result.trim();
  }

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundred = n;

  if (crore > 0) parts.push(numberToWordsUpto9999(crore) + " Crore");
  if (lakh > 0) parts.push(numberToWordsUpto9999(lakh) + " Lakh");
  if (thousand > 0) parts.push(numberToWordsUpto9999(thousand) + " Thousand");
  if (hundred > 0) parts.push(numberToWordsUpto9999(hundred));

  return parts.join(" ").trim();
}

export function numberToWords(input: number | string): string {
  let number: number;
  const MAX_ALLOWED_AMOUNT = 99999999999.99;

  if (typeof input === "string") {
    number = parseFloat(input);
    if (isNaN(number)) return "Invalid input";
  } else {
    number = input;
  }

  if (number > MAX_ALLOWED_AMOUNT) {
    return "The amount is too large. Please type it yourself.";
  }

  number = Math.round(number * 100) / 100;

  const intPart = Math.floor(number);
  const decimalPart = Math.round((number - intPart) * 100);

  const takaWords = convertToWords(intPart) + " Taka";

  if (decimalPart === 0) {
    return takaWords + " Only";
  } else {
    const paisaWords = convertToWords(decimalPart) + " Paisa";
    return takaWords + " and " + paisaWords + " Only";
  }
}
