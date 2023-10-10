import { load as loadHTML } from "cheerio";
import { convert } from "html-to-text";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const htmlToText = (
  html: string,
  allowedTags: string[] = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "a", "span", "table", "thead", "tr", "th", "tbody", "td", "div", "a"]
) => {
  const $ = loadHTML(html);
  const options = {
    wordwrap: 130,
    baseElements: {
      selectors: allowedTags,
    },
    selectors: [{ selector: "footer", format: "skip" }],
  };
  let pageText = convert($("body").html(), options);
  if (pageText.length > 25000) {
    pageText = pageText.substring(0, 25000);
  }
  return pageText;
};

export const getAllInputFields = (html: string) => {
  const $ = loadHTML(html);
  $("*")
    .not(":has(input)")
    .each(function (i: number, el: any) {
      const attributes = Object.values(this.attribs);
      if (el.tagName !== "input" || $(el).attr("type") === "hidden" || attributes.join(" ").includes("hidden")) {
        $(el).remove();
      }
    });
  return $.html();
};
