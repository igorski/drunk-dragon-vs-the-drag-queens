import { loader } from 'zcanvas';
import { createPixelCanvas } from '@/utils/canvas-util';
import {
    ASSET_PATH, CHARACTER_SIZE, BODY_SIZE, BODY_PARTS, fileSuffix
} from '@/definitions/character-female';

export const TARGET_SIZE = 200;

export const generateBitmap = async femaleCharacterToRender => {
    const scale = TARGET_SIZE / CHARACTER_SIZE.width;
    const { appearance } = femaleCharacterToRender;

    const shadows = { src: `${ASSET_PATH}shadows.png` };
    const nose    = { src: `${ASSET_PATH}nose_${fileSuffix(appearance.nose)}.png` };
    const eyes    = { src: `${ASSET_PATH}eyes_${fileSuffix(appearance.eyes)}.png` };
    const hair    = { src: `${ASSET_PATH}hair_${fileSuffix(appearance.hair)}.png` };
    const mouth   = { src: `${ASSET_PATH}mouth_${fileSuffix(appearance.mouth)}.png` };
    const clothes = { src: `${ASSET_PATH}clothes_${fileSuffix(appearance.clothes)}.png` };
    const jewelry = { src: `${ASSET_PATH}jewelry_${fileSuffix(appearance.jewelry)}.png` };

    const imagesToLoad = [ shadows, nose, eyes, hair, mouth, clothes, jewelry ];

    for ( let i = 0; i < imagesToLoad.length; ++i ) {
        const itl = imagesToLoad[ i ];
        itl.img = new Image();

        await loader.loadImage( itl.src, itl.img );
    }

    const { cvs, ctx } = createPixelCanvas( TARGET_SIZE, CHARACTER_SIZE.height * scale );

    renderBodyPart( ctx, shadows, scale, BODY_PARTS.shadows );
    renderBodyPart( ctx, nose,    scale, BODY_PARTS.nose );
    renderBodyPart( ctx, eyes,    scale, BODY_PARTS.eyes );
    renderBodyPart( ctx, hair,    scale, BODY_PARTS.hair );
    renderBodyPart( ctx, mouth,   scale, BODY_PARTS.mouth );
    renderBodyPart( ctx, jewelry, scale, BODY_PARTS.jewelry );

    const out = new Image();
    out.src   = cvs.toDataURL( 'image/png' );

    return out;
};

function renderBodyPart( ctx, { img }, scale, { top, left, width, height }) {
    ctx.drawImage( img, left * scale, top * scale, width * scale, height * scale );
}
