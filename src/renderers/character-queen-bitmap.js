import { loader } from "zcanvas";
import { createPixelCanvas, changeImageColor } from "@/utils/canvas-util";
import { QUEEN_ASSET_PATH, QUEEN_DIMENSIONS, fileSuffix } from "@/definitions/character-types";

export const TARGET_SIZE = 200;

export const generateBitmap = async queenToRender => {
    const scale = TARGET_SIZE / QUEEN_DIMENSIONS.bounds.width;
    const { appearance } = queenToRender;

    const hasHair = appearance.hair !== 8; // hairstyle 8 is optional

    const bodySvg = { src: `${QUEEN_ASSET_PATH}body.svg` };
    const shadows = { src: `${QUEEN_ASSET_PATH}shadows.png` };
    const nose    = { src: `${QUEEN_ASSET_PATH}nose_${fileSuffix(appearance.nose)}.png` };
    const eyes    = { src: `${QUEEN_ASSET_PATH}eyes_${fileSuffix(appearance.eyes)}.png` };
    const hair    = hasHair ? { src: `${QUEEN_ASSET_PATH}hair_${fileSuffix(appearance.hair)}.png` } : null;
    const mouth   = { src: `${QUEEN_ASSET_PATH}mouth_${fileSuffix(appearance.mouth)}.png` };
    const clothes = { src: `${QUEEN_ASSET_PATH}clothes_${fileSuffix(appearance.clothes)}.png` };
    const jewelry = { src: `${QUEEN_ASSET_PATH}jewelry_${fileSuffix(appearance.jewelry)}.png` };

    const imagesToLoad = [ bodySvg, shadows, nose, eyes, hair, mouth, clothes, jewelry ].filter( Boolean );

    for ( let i = 0; i < imagesToLoad.length; ++i ) {
        const itl = imagesToLoad[ i ];
        itl.img = new Image();

        await loader.loadImage( itl.src, itl.img );
    }

    const { cvs, ctx } = createPixelCanvas( TARGET_SIZE, QUEEN_DIMENSIONS.bounds.height * scale );

    // body is SVG and requires custom coloring

    bodySvg.img = changeImageColor( bodySvg.img, appearance.skin );

    // render base body parts

    const { body, parts } = QUEEN_DIMENSIONS;

    renderBodyPart( ctx, bodySvg, scale, body );
    renderBodyPart( ctx, shadows, scale, parts.shadows );
    renderBodyPart( ctx, clothes, scale, parts.clothes );

    // apply circular mask to body and clothes

    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
        cvs.width * .5,
        cvs.height * .5,
        cvs.width * .5,
        0, 2 * Math.PI
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // overlay remaining body parts

    renderBodyPart( ctx, nose,    scale, parts.nose );
    renderBodyPart( ctx, eyes,    scale, parts.eyes );

    if ( hasHair ) {
        renderBodyPart( ctx, hair,    scale, parts.hair );
    }
    renderBodyPart( ctx, mouth,   scale, parts.mouth );
    renderBodyPart( ctx, jewelry, scale, parts.jewelry );

    const out = new Image();
    out.src   = cvs.toDataURL();

    return out;
};

function renderBodyPart( ctx, { img }, scale, { top, left, width, height }) {
    ctx.drawImage( img, left * scale, top * scale, width * scale, height * scale );
}
