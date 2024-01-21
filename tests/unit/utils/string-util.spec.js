import { describe, it, expect } from "vitest";
import { slurWords } from "@/utils/string-util";

describe( "String utility", () => {
    const text = "The ants in France stay mainly on the plants. What do you say ? I'm feeling lighter.";

    it( "should not slur words when the character isn't intoxicated", () => {
        expect( slurWords( text, 0 )).toEqual( text );
    });

    it( "should not slur words when the character is mildly intoxicated", () => {
        expect( slurWords( text, 0.25 )).toEqual( text );
    });

    it( "should lightly slur the words when the character is intoxicated", () => {
        expect( slurWords( text, 0.5 )).toEqual(
            "The antss in France zstay mainly on the plants. What do you zsay ? I'm feeling lighter."
        );
    });

    it( "should slur the words heavily when the character is highly intoxicated", () => {
        expect( slurWords( text, 0.7 )).toEqual(
            "Th-the antsss in France zsstay meynly on the plants. What do yew zssay ? Imma feelin' ligh'er'."
        );
    });
});
