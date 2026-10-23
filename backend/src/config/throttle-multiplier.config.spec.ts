describe('throttle-multiplier.config', () => {
    const originalValue = process.env.E2E_THROTTLE_MULTIPLIER;

    afterEach(() => {
        if (originalValue === undefined) {
            delete process.env.E2E_THROTTLE_MULTIPLIER;
        } else {
            process.env.E2E_THROTTLE_MULTIPLIER = originalValue;
        }
    });

    function loadConfigWith(value: string | undefined) {
        if (value === undefined) {
            delete process.env.E2E_THROTTLE_MULTIPLIER;
        } else {
            process.env.E2E_THROTTLE_MULTIPLIER = value;
        }

        let config!: typeof import('./throttle-multiplier.config');
        jest.isolateModules(() => {
            config = require('./throttle-multiplier.config');
        });
        return config;
    }

    it('should keep production limits when the env var is not set', () => {
        const { THROTTLE_LIMIT_MULTIPLIER, scaleLimit } =
            loadConfigWith(undefined);

        expect(THROTTLE_LIMIT_MULTIPLIER).toBe(1);
        expect(scaleLimit(5)).toBe(5);
    });

    it.each(['', '0', '-3', '2.5', 'abc'])(
        'should fall back to 1 for invalid value "%s"',
        (value) => {
            expect(loadConfigWith(value).THROTTLE_LIMIT_MULTIPLIER).toBe(1);
        },
    );

    it('should scale limits by a valid multiplier', () => {
        const { scaleLimit } = loadConfigWith('100');

        expect(scaleLimit(5)).toBe(500);
    });
});
