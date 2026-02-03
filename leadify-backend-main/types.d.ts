// Custom type declarations

declare module 'bcryptjs' {
    /**
     * Synchronously generates a hash for the given string.
     * @param s String to hash
     * @param salt Salt length or actual salt (default: 10)
     * @returns Hash of the string
     */
    export function hashSync(s: string, salt?: number | string): string;

    /**
     * Asynchronously generates a hash for the given string.
     * @param s String to hash
     * @param salt Salt length or actual salt (default: 10)
     * @param callback Callback receiving the error if any and the hash
     */
    export function hash(s: string, salt: number | string, callback?: (err: Error | null, hash: string) => void): Promise<string>;

    /**
     * Synchronously tests a string against a hash.
     * @param s String to compare
     * @param hash Hash to test against
     * @returns true if matching, otherwise false
     */
    export function compareSync(s: string, hash: string): boolean;

    /**
     * Asynchronously tests a string against a hash.
     * @param s String to compare
     * @param hash Hash to test against 
     * @param callback Callback receiving the error if any and the result
     */
    export function compare(s: string, hash: string, callback?: (err: Error | null, result: boolean) => void): Promise<boolean>;

    /**
     * Synchronously generates a salt.
     * @param rounds Number of rounds (default: 10)
     * @returns Salt
     */
    export function genSaltSync(rounds?: number): string;

    /**
     * Asynchronously generates a salt.
     * @param rounds Number of rounds (default: 10)
     * @param callback Callback receiving the error if any and the salt
     */
    export function genSalt(rounds?: number, callback?: (err: Error | null, salt: string) => void): Promise<string>;

    /**
     * Gets the number of rounds used to encrypt the specified hash.
     * @param hash Hash to extract the used number of rounds from
     * @returns Number of rounds
     */
    export function getRounds(hash: string): number;

    /**
     * Gets the salt portion from a hash.
     * @param hash Hash to extract the salt from
     * @returns Salt or undefined if invalid
     */
    export function getSalt(hash: string): string;
}
