import { ReactElement } from "react";
import Link from "next/link";
import z from "zod";

export function EndpointDocs({
  requestHeaders,
  requestPath,
  requestQuery,
  requestBody,
  responseBody,
  responseBodyStreaming,
}: {
  requestHeaders?: z.ZodType;
  requestPath?: z.ZodType;
  requestQuery?: z.ZodType;
  requestBody?: z.ZodType;
  responseBody?: z.ZodType;
  responseBodyStreaming?: z.ZodType;
}): ReactElement {
  return (
    <div className="docsContent container">
      <Link
        href="/docs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--accent)',
          textDecoration: 'none',
          marginBottom: '24px',
        }}
      >
        <span>←</span> All Endpoints
      </Link>
      <div className="docsSections">
        {requestHeaders && (
          <Section title="Request Headers" schema={requestHeaders} />
        )}
        {requestPath && (
          <Section title="Request Path" schema={requestPath} />
        )}
        {requestQuery && (
          <Section title="Request Query" schema={requestQuery} />
        )}
        {requestBody && (
          <Section title="Request Body" schema={requestBody} />
        )}
        {responseBody && (
          <Section title="Response Body" schema={responseBody} />
        )}
        {responseBodyStreaming && (
          <Section
            title="Response Body (Streaming)"
            schema={responseBodyStreaming}
          />
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  schema,
}: {
  title: string;
  schema: z.ZodType;
}): ReactElement {
  return (
    <div className="docsSection">
      <h3 className="docsSectionTitle">{title}</h3>
      <div className="docsSectionContent">
        <Property schema={schema} expanded />
      </div>
    </div>
  );
}

export function Property({
  name,
  schema,
  description,
  title,
  optional = false,
  nullable = false,
  expanded = false,
}: {
  name?: string;
  schema: z.ZodType;
  description?: string;
  title?: string;
  optional?: boolean;
  nullable?: boolean;
  expanded?: boolean;
}): ReactElement {
  const params = { description, title, optional, nullable };
  schema = unwrapSchema(schema, params);

  const properties: SchemaProperty[] = [];
  getSchemaChildren(schema, properties, params);

  if (expanded) {
    return (
      <div className="docsPropertyList">
        {properties.map(
          (
            {
              name: propertyName,
              schema: propertySchema,
              description: propertyDescription,
              optional: propertyOptional,
              nullable: propertyNullable,
            },
            index
          ) => (
            <Property
              key={index}
              name={propertyName}
              schema={propertySchema}
              description={propertyDescription}
              optional={propertyOptional}
              nullable={propertyNullable}
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="docsProperty">
      <div className="docsPropertyHeader">
        {(name || params.title) && (
          <span className="docsPropertyName">{name || params.title}</span>
        )}
        {schema.def.type === "literal" ? (
          <span className="docsBadge">
            {typeof (schema as z.ZodLiteral).value === "string"
              ? `"${(schema as z.ZodLiteral).value}"`
              : `${(schema as z.ZodLiteral).value}`}
          </span>
        ) : (
          schema.def.type !== "lazy" && (
            <span className="docsBadge docsBadgeMono">
              {schema.def.type}
            </span>
          )
        )}
        {"minValue" in schema &&
          schema.minValue !== null &&
          schema.minValue !== -Infinity && (
            <span className="docsBadge docsBadgeMono">
              min: {`${schema.minValue}`}
            </span>
          )}
        {"maxValue" in schema &&
          schema.maxValue !== null &&
          schema.maxValue !== Infinity && (
            <span className="docsBadge docsBadgeMono">
              max: {`${schema.maxValue}`}
            </span>
          )}
        {name &&
          (params.optional || params.nullable ? (
            <span className="docsOptional">optional</span>
          ) : (
            <span className="docsRequired">*required</span>
          ))}
      </div>
      {params.description && (
        <p className="docsDescription">{params.description}</p>
      )}
      {properties.length > 0 && (
        <details className="docsDetails">
          <summary>
            {schema.def.type === "object" && "Properties"}
            {schema.def.type === "record" && "Values"}
            {schema.def.type === "union" && "Variants"}
            {schema.def.type === "enum" && "Variants"}
            {schema.def.type === "array" && "Items"}
          </summary>
          <div className="docsNestedProperties">
            {properties.map(
              (
                {
                  name: propertyName,
                  schema: propertySchema,
                  description: propertyDescription,
                  optional: propertyOptional,
                  nullable: propertyNullable,
                },
                index
              ) => (
                <Property
                  key={index}
                  name={propertyName}
                  schema={propertySchema}
                  description={propertyDescription}
                  optional={propertyOptional}
                  nullable={propertyNullable}
                />
              )
            )}
          </div>
        </details>
      )}
    </div>
  );
}

interface SchemaParams {
  description?: string;
  title?: string;
  optional: boolean;
  nullable: boolean;
}

interface SchemaProperty {
  name?: string;
  schema: z.ZodType;
  description?: string;
  title?: string;
  optional: boolean;
  nullable: boolean;
}

function unwrapSchema(schema: z.ZodType, params: SchemaParams): z.ZodType {
  if (schema.description && !params.description) {
    params.description = schema.description;
  }
  let meta = schema.meta();
  if (meta?.title && !params.title) {
    params.title = meta.title;
  }
  while (
    (schema.def.type === "optional" ||
      schema.def.type === "nullable" ||
      schema.def.type === "lazy") &&
    meta?.recursive !== true
  ) {
    if (schema.def.type === "optional") {
      params.optional = true;
      schema = (schema as z.ZodOptional<z.ZodType>).unwrap();
    } else if (schema.def.type === "nullable") {
      params.nullable = true;
      schema = (schema as z.ZodNullable<z.ZodType>).unwrap();
    } else if (schema.def.type === "lazy") {
      schema = (schema as z.ZodLazy<z.ZodType>).def.getter();
    }
    if (schema.description && !params.description) {
      params.description = schema.description;
    }
    meta = schema.meta();
    if (meta?.title && !params.title) {
      params.title = meta.title;
    }
  }
  return schema;
}

function getSchemaChildren(
  schema: z.ZodType,
  properties: SchemaProperty[],
  optional: { optional: boolean; nullable: boolean }
) {
  const meta = schema.meta();
  if (meta?.recursive === true) {
    return;
  } else if (schema.def.type === "object") {
    for (const [key, value] of Object.entries(
      (schema as z.ZodObject).shape
    )) {
      const propertyMeta = value.meta();
      if (propertyMeta?.recursive === true) {
        properties.push({
          name: key,
          schema: value,
          description: value.description,
          title: propertyMeta?.title,
          optional: false,
          nullable: false,
        });
      } else {
        const propertyParams: SchemaParams = {
          optional: false,
          nullable: false,
          description: undefined,
          title: undefined,
        };
        const property = unwrapSchema(value, propertyParams);
        properties.push({
          name: key,
          schema: property,
          description: propertyParams.description,
          title: propertyParams.title,
          optional: propertyParams.optional,
          nullable: propertyParams.nullable,
        });
      }
    }
  } else if (schema.def.type === "record") {
    const value = (schema as z.ZodRecord<z.core.$ZodRecordKey, z.ZodType>)
      .valueType;
    const propertyMeta = value.meta();
    if (propertyMeta?.recursive === true) {
      properties.push({
        schema: value,
        description: value.description,
        title: propertyMeta?.title,
        optional: false,
        nullable: false,
      });
    } else {
      const propertyParams: SchemaParams = {
        optional: false,
        nullable: false,
        description: undefined,
        title: undefined,
      };
      const property = unwrapSchema(
        (schema as z.ZodRecord<z.core.$ZodRecordKey, z.ZodType>).valueType,
        propertyParams
      );
      if (flattenable(property)) {
        getSchemaChildren(property, properties, propertyParams);
      } else {
        properties.push({
          schema: property,
          description: propertyParams.description,
          title: propertyParams.title,
          optional: false,
          nullable: false,
        });
      }
      if (propertyParams.optional || propertyParams.nullable) {
        let undefinedProperty = false;
        let nullProperty = false;
        for (const property of properties) {
          undefinedProperty ||= property.schema.def.type === "undefined";
          nullProperty ||= property.schema.def.type === "null";
        }
        if (propertyParams.optional && !undefinedProperty) {
          properties.push({
            schema: z.undefined(),
            optional: false,
            nullable: false,
          });
        }
        if (propertyParams.nullable && !nullProperty) {
          properties.push({
            schema: z.null(),
            optional: false,
            nullable: false,
          });
        }
      }
    }
  } else if (schema.def.type === "union") {
    for (const option of (schema as z.ZodUnion<z.ZodType[]>).options) {
      const propertyMeta = option.meta();
      if (propertyMeta?.recursive === true) {
        properties.push({
          schema: option,
          description: option.description,
          title: propertyMeta?.title,
          optional: false,
          nullable: false,
        });
      } else {
        const propertyParams: SchemaParams = {
          optional: false,
          nullable: false,
          description: undefined,
          title: undefined,
        };
        const property = unwrapSchema(option, propertyParams);
        optional.optional ||= propertyParams.optional;
        optional.nullable ||= propertyParams.nullable;
        if (flattenable(property)) {
          getSchemaChildren(property, properties, optional);
        } else {
          properties.push({
            schema: property,
            description: propertyParams.description,
            title: propertyParams.title,
            optional: false,
            nullable: false,
          });
        }
      }
    }
  } else if (schema.def.type === "enum") {
    for (const option of (schema as z.ZodEnum).options) {
      properties.push({
        schema: z.literal(option),
        optional: false,
        nullable: false,
      });
    }
  } else if (schema.def.type === "array") {
    const element = (schema as z.ZodArray<z.ZodType>).element;
    const propertyMeta = element.meta();
    if (propertyMeta?.recursive === true) {
      properties.push({
        schema: element,
        description: element.description,
        title: propertyMeta?.title,
        optional: false,
        nullable: false,
      });
    } else {
      const propertyParams: SchemaParams = {
        optional: false,
        nullable: false,
        description: undefined,
        title: undefined,
      };
      const property = unwrapSchema(
        (schema as z.ZodArray<z.ZodType>).element,
        propertyParams
      );
      if (flattenable(property)) {
        getSchemaChildren(property, properties, propertyParams);
      } else {
        properties.push({
          schema: property,
          description: propertyParams.description,
          title: propertyParams.title,
          optional: false,
          nullable: false,
        });
      }
      if (propertyParams.optional || propertyParams.nullable) {
        let undefinedProperty = false;
        let nullProperty = false;
        for (const property of properties) {
          undefinedProperty ||= property.schema.def.type === "undefined";
          nullProperty ||= property.schema.def.type === "null";
        }
        if (propertyParams.optional && !undefinedProperty) {
          properties.push({
            schema: z.undefined(),
            optional: false,
            nullable: false,
          });
        }
        if (propertyParams.nullable && !nullProperty) {
          properties.push({
            schema: z.null(),
            optional: false,
            nullable: false,
          });
        }
      }
    }
  }
}

function flattenable(schema: z.ZodType): boolean {
  return schema.def.type === "union" || schema.def.type === "enum";
}
