import { AccessLevel } from "../constants/enums";

export default function hasWriteAccess(accessLevel) {
    return (accessLevel === AccessLevel.ADMIN || accessLevel === AccessLevel.WRITE);
}