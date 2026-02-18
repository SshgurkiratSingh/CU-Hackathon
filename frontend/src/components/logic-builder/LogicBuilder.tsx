"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, Eye } from "lucide-react";

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type Variable = {
  id: string;
  name: string;
  source: "telemetry" | "device" | "context" | "constant";
  key?: string;
  value?: string | number;
};

type Condition = {
  id: string;
  left: string;
  operator: ">" | "<" | "==" | "!=" | ">=" | "<=" | "contains";
  right: string;
  logicOp?: "AND" | "OR";
};

type Action = {
  id: string;
  type: "actuator" | "notification" | "text" | "set_var" | "mqtt_publish";
  target?: string;
  command?: string;
  value?: string | number;
  message?: string;
  varName?: string;
  topic?: string;
  outputKey?: string;
};

export type LogicBlock = {
  variables: Variable[];
  conditions: Condition[];
  thenActions: Action[];
  elseActions: Action[];
};

interface LogicBuilderProps {
  block: LogicBlock;
  onChange: (block: LogicBlock) => void;
  devices?: Array<{ 
    id: string; 
    name: string; 
    sensors?: Array<{ key: string; label: string; sensorType: string; mqttTopic?: string }>;
    actuatorOutputs?: Array<{ key: string; label: string; commandTopic: string }>;
  }>;
}

export function LogicBuilder({ block, onChange, devices = [] }: LogicBuilderProps) {
  const [showVarValues, setShowVarValues] = useState(false);

  const addVariable = () => {
    onChange({
      ...block,
      variables: [...block.variables, { id: generateId(), name: "", source: "telemetry", key: "", value: "" }],
    });
  };

  const updateVariable = (id: string, updates: Partial<Variable>) => {
    onChange({ ...block, variables: block.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)) });
  };

  const removeVariable = (id: string) => {
    onChange({ ...block, variables: block.variables.filter((v) => v.id !== id) });
  };

  const addCondition = () => {
    onChange({
      ...block,
      conditions: [...block.conditions, { id: generateId(), left: "", operator: ">", right: "", logicOp: block.conditions.length > 0 ? "AND" : undefined }],
    });
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    onChange({ ...block, conditions: block.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)) });
  };

  const removeCondition = (id: string) => {
    onChange({ ...block, conditions: block.conditions.filter((c) => c.id !== id) });
  };

  const addAction = (type: "then" | "else") => {
    const newAction: Action = { id: generateId(), type: "actuator", target: "", command: "on", outputKey: "" };
    onChange({
      ...block,
      [type === "then" ? "thenActions" : "elseActions"]: [...(type === "then" ? block.thenActions : block.elseActions), newAction],
    });
  };

  const updateAction = (id: string, type: "then" | "else", updates: Partial<Action>) => {
    onChange({
      ...block,
      [type === "then" ? "thenActions" : "elseActions"]: (type === "then" ? block.thenActions : block.elseActions).map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const removeAction = (id: string, type: "then" | "else") => {
    onChange({
      ...block,
      [type === "then" ? "thenActions" : "elseActions"]: (type === "then" ? block.thenActions : block.elseActions).filter((a) => a.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Variables</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowVarValues(!showVarValues)}>
              <Eye className="h-4 w-4 mr-1" /> {showVarValues ? "Hide" : "Show"}
            </Button>
            <Button size="sm" onClick={addVariable}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {block.variables.map((variable) => (
            <div key={variable.id} className="flex gap-2 items-center bg-white p-3 rounded border">
              <Input placeholder="name" value={variable.name} onChange={(e) => updateVariable(variable.id, { name: e.target.value })} className="w-32" />
              <Select value={variable.source} onChange={(e) => updateVariable(variable.id, { source: e.target.value as Variable["source"] })} className="w-32">
                <option value="telemetry">Telemetry</option>
                <option value="device">Device</option>
                <option value="context">Context</option>
                <option value="constant">Constant</option>
              </Select>
              {variable.source !== "constant" ? (
                <Input placeholder="key" value={variable.key || ""} onChange={(e) => updateVariable(variable.id, { key: e.target.value })} className="flex-1" />
              ) : (
                <Input placeholder="value" value={variable.value || ""} onChange={(e) => updateVariable(variable.id, { value: e.target.value })} className="flex-1" />
              )}
              {showVarValues && (
                <span className="text-sm text-gray-600 px-3 py-1 bg-blue-50 rounded border border-blue-200">
                  ${variable.name || "?"} = {variable.source === "constant" ? variable.value : `[${variable.source}.${variable.key}]`}
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => removeVariable(variable.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">IF Conditions</h3>
          <Button size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {block.conditions.map((condition, index) => (
            <div key={condition.id}>
              {index > 0 && condition.logicOp && (
                <div className="flex justify-center my-2">
                  <Select value={condition.logicOp} onChange={(e) => updateCondition(condition.id, { logicOp: e.target.value as "AND" | "OR" })} className="w-24 font-bold">
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 items-center bg-white p-3 rounded border">
                <div className="flex-1">
                  <Input placeholder="$var or value" value={condition.left} onChange={(e) => updateCondition(condition.id, { left: e.target.value })} />
                  <Select className="mt-1 text-xs" onChange={(e) => updateCondition(condition.id, { left: e.target.value })}>
                    <option value="">Or select sensor</option>
                    {devices.flatMap((device) =>
                      (device.sensors || []).map((sensor) => (
                        <option key={`${device.id}-${sensor.key}`} value={`$${sensor.key}`}>
                          {device.name} • {sensor.label} ({sensor.sensorType})
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <Select value={condition.operator} onChange={(e) => updateCondition(condition.id, { operator: e.target.value as Condition["operator"] })} className="w-28">
                  <option value=">">{">"}</option>
                  <option value="<">{"<"}</option>
                  <option value=">=">{">="}</option>
                  <option value="<=">{" <="}</option>
                  <option value="==">{"=="}</option>
                  <option value="!=">{"!="}</option>
                  <option value="contains">contains</option>
                </Select>
                <div className="flex-1">
                  <Input placeholder="$var or value" value={condition.right} onChange={(e) => updateCondition(condition.id, { right: e.target.value })} />
                  <Select className="mt-1 text-xs" onChange={(e) => updateCondition(condition.id, { right: e.target.value })}>
                    <option value="">Or select sensor</option>
                    {devices.flatMap((device) =>
                      (device.sensors || []).map((sensor) => (
                        <option key={`${device.id}-${sensor.key}`} value={`$${sensor.key}`}>
                          {device.name} • {sensor.label} ({sensor.sensorType})
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeCondition(condition.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">THEN Actions</h3>
          <Button size="sm" onClick={() => addAction("then")}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {block.thenActions.map((action) => (
            <div key={action.id} className="flex gap-2 items-center bg-white p-3 rounded border">
              <Select value={action.type} onChange={(e) => updateAction(action.id, "then", { type: e.target.value as Action["type"] })} className="w-36">
                <option value="actuator">Actuator</option>
                <option value="set_var">Set Variable</option>
                <option value="mqtt_publish">MQTT Publish</option>
                <option value="notification">Notification</option>
                <option value="text">Text</option>
              </Select>
              {action.type === "actuator" ? (
                <>
                  <Select value={action.target || ""} onChange={(e) => updateAction(action.id, "then", { target: e.target.value })} className="flex-1">
                    <option value="">Select device</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </Select>
                  <Select value={action.outputKey || ""} onChange={(e) => updateAction(action.id, "then", { outputKey: e.target.value })} className="flex-1">
                    <option value="">Select output</option>
                    {devices
                      .find((d) => d.id === action.target)
                      ?.actuatorOutputs?.map((output) => (
                        <option key={output.key} value={output.key}>
                          {output.label}
                        </option>
                      ))}
                  </Select>
                  <Select value={action.command || "on"} onChange={(e) => updateAction(action.id, "then", { command: e.target.value })} className="w-28">
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                    <option value="toggle">TOGGLE</option>
                    <option value="set">SET</option>
                  </Select>
                  {action.command === "set" && (
                    <Input type="number" placeholder="value" value={action.value || ""} onChange={(e) => updateAction(action.id, "then", { value: Number(e.target.value) })} className="w-24" />
                  )}
                </>
              ) : action.type === "set_var" ? (
                <>
                  <Select value={action.varName || ""} onChange={(e) => updateAction(action.id, "then", { varName: e.target.value })} className="flex-1">
                    <option value="">Select variable</option>
                    {block.variables.map((v) => (
                      <option key={v.id} value={v.name}>
                        ${v.name}
                      </option>
                    ))}
                  </Select>
                  <Input placeholder="new value" value={action.value || ""} onChange={(e) => updateAction(action.id, "then", { value: e.target.value })} className="flex-1" />
                </>
              ) : action.type === "mqtt_publish" ? (
                <>
                  <Input placeholder="topic" value={action.topic || ""} onChange={(e) => updateAction(action.id, "then", { topic: e.target.value })} className="flex-1" />
                  <Input placeholder="payload" value={action.message || ""} onChange={(e) => updateAction(action.id, "then", { message: e.target.value })} className="flex-1" />
                </>
              ) : (
                <Input placeholder="message" value={action.message || ""} onChange={(e) => updateAction(action.id, "then", { message: e.target.value })} className="flex-1" />
              )}
              <Button size="sm" variant="ghost" onClick={() => removeAction(action.id, "then")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">ELSE Actions (Optional)</h3>
          <Button size="sm" onClick={() => addAction("else")}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {block.elseActions.map((action) => (
            <div key={action.id} className="flex gap-2 items-center bg-white p-3 rounded border">
              <Select value={action.type} onChange={(e) => updateAction(action.id, "else", { type: e.target.value as Action["type"] })} className="w-36">
                <option value="actuator">Actuator</option>
                <option value="set_var">Set Variable</option>
                <option value="mqtt_publish">MQTT Publish</option>
                <option value="notification">Notification</option>
                <option value="text">Text</option>
              </Select>
              {action.type === "actuator" ? (
                <>
                  <Select value={action.target || ""} onChange={(e) => updateAction(action.id, "else", { target: e.target.value })} className="flex-1">
                    <option value="">Select device</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </Select>
                  <Select value={action.outputKey || ""} onChange={(e) => updateAction(action.id, "else", { outputKey: e.target.value })} className="flex-1">
                    <option value="">Select output</option>
                    {devices
                      .find((d) => d.id === action.target)
                      ?.actuatorOutputs?.map((output) => (
                        <option key={output.key} value={output.key}>
                          {output.label}
                        </option>
                      ))}
                  </Select>
                  <Select value={action.command || "on"} onChange={(e) => updateAction(action.id, "else", { command: e.target.value })} className="w-28">
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                    <option value="toggle">TOGGLE</option>
                    <option value="set">SET</option>
                  </Select>
                  {action.command === "set" && (
                    <Input type="number" placeholder="value" value={action.value || ""} onChange={(e) => updateAction(action.id, "else", { value: Number(e.target.value) })} className="w-24" />
                  )}
                </>
              ) : action.type === "set_var" ? (
                <>
                  <Select value={action.varName || ""} onChange={(e) => updateAction(action.id, "else", { varName: e.target.value })} className="flex-1">
                    <option value="">Select variable</option>
                    {block.variables.map((v) => (
                      <option key={v.id} value={v.name}>
                        ${v.name}
                      </option>
                    ))}
                  </Select>
                  <Input placeholder="new value" value={action.value || ""} onChange={(e) => updateAction(action.id, "else", { value: e.target.value })} className="flex-1" />
                </>
              ) : action.type === "mqtt_publish" ? (
                <>
                  <Input placeholder="topic" value={action.topic || ""} onChange={(e) => updateAction(action.id, "else", { topic: e.target.value })} className="flex-1" />
                  <Input placeholder="payload" value={action.message || ""} onChange={(e) => updateAction(action.id, "else", { message: e.target.value })} className="flex-1" />
                </>
              ) : (
                <Input placeholder="message" value={action.message || ""} onChange={(e) => updateAction(action.id, "else", { message: e.target.value })} className="flex-1" />
              )}
              <Button size="sm" variant="ghost" onClick={() => removeAction(action.id, "else")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
