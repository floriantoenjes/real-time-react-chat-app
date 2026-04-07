import { AppController } from './app.controller';
import { TestBed } from '@suites/unit';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const { unit } = await TestBed.solitary(AppController).compile();

        appController = unit;
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.isReady()).toBe(true);
        });
    });
});
