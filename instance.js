import {AWSType, AWSTaggable, mix} from "aws-async-type";

export class Instance extends AWSType {
  constructor(region, iddef) {
    super(region, "InstanceId", iddef);
  }

  static async runInstance(region, {
    ImageId,
    InstanceType,
    MaxCount=1,
    MinCount=1,
    ...params
  }={}) {
    params = {ImageId, InstanceType, ...params, MaxCount: 1, MinCount: 1};
    const result = await region.runInstances(params);
    return new Instance(region, result.Instances[0]);
  }

  static async runInstances(region, {
    ImageId,
    InstanceId,
    MaxCount=1,
    MinCount=1,
    ...params
  }={}) {
    params = {ImageId, InstanceId, MaxCount, MinCount, ...params};
    const result = await region.runInstances(params)
    return result.Instances.map(i => new Instance(region, i));
  }

  async describe() {
    const {InstanceId} = this;
    const InstanceIds = [InstanceId];

    let result;

    for await (const instance of this.api.describeInstances({InstanceIds})) {
      if (result) throw new Error("ambiguous result");
      result = instance;
    }

    return Object.assign(this, result);
  }

  async modifyGroups(groups) {
    await this.#modifyAttribute("Groups", groups);
  }

  async waitForStatusOk() {
    const {InstanceId} = this;
    const InstanceIds = [InstanceId];

    await this.api.waitFor("instanceStatusOk", {InstanceIds});
  }

  async waitForRunning() {
    const {InstanceId} = this;
    const InstanceIds = [InstanceId];

    await this.api.waitFor("instanceRunning", {InstanceIds});
  }

  async #modifyAttribute(name, value) {
    this.throwIfUnidentified();

    return this.api.modifyInstanceAttribute({
      InstanceId: this.InstanceId,
      [name]: value
    });
  }
}

mix(Instance, AWSTaggable);
