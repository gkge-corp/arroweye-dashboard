"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { HiMiniChevronUpDown } from "react-icons/hi2";
import { FiInfo } from "react-icons/fi";
import { GoArrowDown } from "react-icons/go";

interface DropdownInputProps {
  className?: string;
  label?: string;
  labelClassName?: string;
  options: { value: string | number; label: string }[];
  error?: string;
  info?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  name?: string;
  icon?: boolean;
  placeholder?: string;
  rounded?: boolean;
}

const SelectInput: React.FC<DropdownInputProps> = ({
  className,
  label,
  labelClassName,
  options,
  error,
  info,
  value,
  onChange,
  icon,
  placeholder = "Select an option",
  rounded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [selectedValue, setSelectedValue] = useState<string | number>(
    value || "",
  );
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleSelect = (newValue: string | number) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    if (onChange) {
      onChange(newValue);
    }
  };

  const selectedLabel = options.find(
    (opt) => opt.value === selectedValue,
  )?.label;

  const updateDropdownPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) return;

    const gap = 4;
    const maxMenuHeight = 240;
    const bottomSpace = window.innerHeight - rect.bottom;
    const shouldOpenUp = bottomSpace < maxMenuHeight && rect.top > bottomSpace;

    setDropdownStyle({
      left: rect.left,
      top: shouldOpenUp
        ? Math.max(gap, rect.top - maxMenuHeight - gap)
        : rect.bottom + gap,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    // The menu is portaled to <body>, which Radix marks as an outside layer
    // while a modal Dialog is open. Without this the dialog treats a menu
    // click as an outside interaction and closes itself.
    const menuNode = menuRef.current;
    const stopPointerDown = (event: PointerEvent) => event.stopPropagation();

    updateDropdownPosition();
    menuNode?.addEventListener("pointerdown", stopPointerDown);
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      menuNode?.removeEventListener("pointerdown", stopPointerDown);
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen]);

  return (
    <div className="flex flex-col space-y-2 font-SansFlex">
      <div className="flex items-center space-x-2">
        {label && (
          <label
            className={cn(
              "tracking-[.1rem] text-[12px] font-[400] text-[#212529] leading-[18px]",
              labelClassName,
            )}
          >
            {label}
          </label>
        )}
        {info && (
          <div className="relative group">
            <FiInfo className="text-gray-400 hover:text-blue-500 cursor-pointer" />
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 hidden w-48 p-2 text-xs text-white bg-black rounded-lg group-hover:block">
              {info}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={triggerRef}
          onClick={() => {
            if (!isOpen) {
              updateDropdownPosition();
            }

            setIsOpen(!isOpen);
          }}
          className={cn(
            "relative block w-full border font-SansFlex border-black bg-white pl-4 pr-10  text-gray-900 shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-300",
            rounded
              ? "rounded-full py-[5px] text-[14px] "
              : "rounded-[8px] text-[14px] py-[2px] flex items-center  h-[51px]",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
        >
          <div className="flex items-center text-[14px] font-SansFlex">
            <span>{selectedLabel || placeholder}</span>
          </div>

          <div className="absolute inset-y-0 right-3 flex items-center space-x-2 pointer-events-none">
            {icon === true ? (
              <GoArrowDown />
            ) : (
              <HiMiniChevronUpDown className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>

        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={menuRef}
              style={dropdownStyle}
              className="fixed z-[9999] pointer-events-auto border border-border bg-popover text-popover-foreground shadow-md rounded-[8px] max-h-60 overflow-y-auto scrollbar-hide scrollbar-hide::-webkit-scrollbar"
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "px-[16px] py-2 text-[14px] font-SansFlex cursor-pointer hover:bg-muted",
                    selectedValue === option.value && "bg-muted",
                  )}
                >
                  {option.label}
                </div>
              ))}
            </div>,
            document.body,
          )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export { SelectInput };
