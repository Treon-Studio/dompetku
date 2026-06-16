"use client";

import { CheckCircle, SortVertical } from "@solar-icons/react";
import * as React from "react";

import { Button } from "~/shared/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/shared/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/shared/components/ui/popover";

import { cn } from "~/shared/lib/utils";

export function Combobox({
	data,
	selected,
	onChange,
}: {
	data: any;
	selected: string;
	onChange: (value: string) => void;
}) {
	const [open, setOpen] = React.useState(false);
	const [value, setValue] = React.useState(selected);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
					{value ? data.find((datum: any) => datum.value === value)?.label : "Select..."}
					<SortVertical className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0">
				<Command>
					<CommandInput placeholder="Search here" />
					<CommandEmpty>No data</CommandEmpty>
					<CommandList>
						<CommandGroup>
							{data.map((datum: any) => (
								<CommandItem
									key={`${datum.value}-${datum.label}`}
									value={datum.label}
									onSelect={(selectedLabel: any) => {
										const { value: selectedValue } = data.find(
											(datum: any) => datum.label?.toLowerCase() === selectedLabel,
										) || { value };
										setValue(selectedValue);
										onChange(selectedValue);
										setOpen(false);
									}}
								>
									<CheckCircle className={cn("mr-2 h-4 w-4", value === datum.value ? "opacity-100" : "opacity-0")} />
									{datum.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
