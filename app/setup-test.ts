import { cleanup } from "@testing-library/react";
import { beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

beforeEach(() => {
	cleanup();
});
