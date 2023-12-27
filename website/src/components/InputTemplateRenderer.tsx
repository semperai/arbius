import { useState } from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'

import StringInput from '@/components/inputs/StringInput';
import IntInput from '@/components/inputs/IntInput';
import DecimalInput from '@/components/inputs/DecimalInput';
import StringEnumInput from '@/components/inputs/StringEnumInput';
import IntEnumInput from '@/components/inputs/IntEnumInput';

import { Template, TemplateInput } from '@/types/Template';

interface Props {
  template: Template;
  inputData: Map<string, number|string>;
  setInputData: (m: Map<string, number|string>) => void;
}


export default function InputTemplateRenderer({ template, inputData, setInputData }: Props) {
  function renderInputs(rows: TemplateInput[]) {
    function value(row: TemplateInput) {
      return inputData.get(row.variable) ?? row.default;
    }

    function setValue(row: TemplateInput) {
      return (v: string|number) => {
        setInputData(new Map(inputData.set(row.variable, v)));
        // console.log(inputData);
      }
    }

    return rows.map((row) => (
      <div key={row.variable} className="grid grid-cols-1 items-start gap-4 py-4">
        <label htmlFor={row.variable} className="block text-sm font-medium leading-6 text-slate-800 sm:pt-1.5">
          <span className="bg-slate-100 border-slate-200 border p-2 rounded-md font-mono">
            {row.variable}
          </span>
        </label>
        <div className="mt-2 sm:col-span-2 sm:mt-0">
          { row.type === 'string' && (
            <StringInput
              variable={row.variable}
              value={value(row) as string}
              setValue={setValue(row)}
            />
          ) }
          { row.type === 'int' && (
            <IntInput
              variable={row.variable}
              value={value(row) as number}
              setValue={setValue(row)}
              min={row.min as number}
              max={row.max as number}
            />
          ) }
          { row.type === 'decimal' && (
            <DecimalInput
              variable={row.variable}
              value={value(row) as number}
              setValue={setValue(row)}
              min={row.min as number}
              max={row.max as number}
            />
          ) }
          { row.type === 'int_enum' && (
            <IntEnumInput
              variable={row.variable}
              value={value(row) as number}
              setValue={setValue(row)}
              choices={row.choices as number[]}
            />
          ) }
          { row.type === 'string_enum' && (
            <StringEnumInput
              variable={row.variable}
              value={value(row) as string}
              setValue={setValue(row)}
              choices={row.choices as string[]}
            />
          ) }
        </div>
        <div className="mt-2 sm:col-span-2 sm:mt-0">
          <p className="text-sm text-slate-600 pl-1 md:pr-20">
            {row.description}
          </p>
        </div>
      </div>
    ))
  }

  return (
    <div className="w-full">
      <h2 className="text-base font-semibold leading-7 text-slate-900">
        {template.meta.title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 md:pr-10">
        {template.meta.description}
      </p>

      <div className="md:mt-10 md:space-y-8 md:pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:pb-0">
        { renderInputs((template as Template).input.filter((row) => row.required)) }

        <Disclosure as="div" className="pt-6 border-none">
          {({ open }) => (
            <>
              <dt>
                <Disclosure.Button className="flex w-full items-start justify-between text-left text-slate-900">
                  <span className="text-base font-semibold leading-7">
                    Optional <span className="text-sm text-slate-800">({ (template as Template).input.filter((row) => ! row.required).length } items)</span>
                  </span>
                  <span className="ml-6 flex h-7 items-center">
                    {open ? (
                      <MinusSmallIcon className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <PlusSmallIcon className="h-6 w-6" aria-hidden="true" />
                    )}
                  </span>
                </Disclosure.Button>
              </dt>
              <div className="text-sm">
                Changing optional parameters may result in your task not being mined.
              </div>
              <Disclosure.Panel as="dd" className="mt-2">
                { renderInputs((template as Template).input.filter((row) => ! row.required)) }
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
}
