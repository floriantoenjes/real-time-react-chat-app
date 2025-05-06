import { SetMetadata } from '@nestjs/common';

// TODO: Extract into env file and change
export const jwtConstants = {
    secret: 'DO NOT USE THIS VALUE. INSTEADACOMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
