import learntModel from "./model.generated.json";
import priorsModel from "./priors.generated.json";
import type { BnModel } from "../types";

export const learnt = learntModel as BnModel;
export const priors = priorsModel as BnModel;
